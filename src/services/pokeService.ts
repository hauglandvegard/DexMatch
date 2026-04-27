import {
    buildCleanSpeciesData,
    fetchTypeList,
    fetchRegionSpeciesIds,
    fetchSpeciesIdsByTypes,
} from "./pokeApi.service";
import getJokeForType from "./CNService";
import generatePokemon from "./pokeGenerator";
import {
    insertPokemon,
    getUnswipedPokemon,
    getAllUnswipedPokemon,
    getPokemonCount,
    getLikedPokemon,
} from "../models/Pokemon";
import { getWantedTypeIds, getUserById } from "../models/User";
import { Pokemon } from "../types/pokemon.types";
import logger from "../utils/logger";

const MAX_SPECIES_ID = 898;
const POOL_SIZE = 20;
const POOL_LOW_THRESHOLD = 10;

export interface PokemonProfile {
    pokemon: Pokemon;
    speciesName: string;
    types: string[];
    spriteUrl: string;
    shinySpriteUrl: string;
}

async function buildCandidateIds(
    wantedTypeIds: number[],
    regionId: number | null,
): Promise<number[]> {
    const [typeList, regionIds] = await Promise.all([
        wantedTypeIds.length > 0 ? fetchTypeList() : Promise.resolve([]),
        regionId && regionId > 0
            ? fetchRegionSpeciesIds(regionId)
            : Promise.resolve(new Set<number>()),
    ]);

    const idToName = new Map(typeList.map((t) => [t.id, t.name]));
    const wantedNames = wantedTypeIds
        .map((id) => idToName.get(id))
        .filter((n): n is string => Boolean(n));
    const typeIds =
        wantedNames.length > 0
            ? await fetchSpeciesIdsByTypes(wantedNames)
            : new Set<number>();

    if (typeIds.size === 0 && regionIds.size === 0) return [];
    if (typeIds.size === 0) return Array.from(regionIds);
    if (regionIds.size === 0) return Array.from(typeIds);
    return Array.from(typeIds).filter((id) => regionIds.has(id));
}

async function generateAndInsert(candidateIds?: number[]): Promise<void> {
    let speciesId: number;
    if (candidateIds && candidateIds.length > 0) {
        speciesId =
            candidateIds[Math.floor(Math.random() * candidateIds.length)];
    } else {
        speciesId = Math.floor(Math.random() * MAX_SPECIES_ID) + 1;
    }
    const speciesData = await buildCleanSpeciesData(speciesId);
    if (!speciesData) return;
    const primaryType = speciesData.types[0] ?? "normal";
    const joke = await getJokeForType(primaryType);
    const draft = generatePokemon(speciesData, joke);
    insertPokemon(draft);
}

export async function seedPool(
    targetSize: number = POOL_SIZE,
    userId?: number,
): Promise<void> {
    const current = getPokemonCount();
    const needed = Math.max(0, targetSize - current);
    if (needed === 0) return;

    let candidateIds: number[] | undefined;
    if (userId !== undefined) {
        const wantedTypeIds = getWantedTypeIds(userId);
        const regionId = getUserById(userId)?.regionIdPref ?? null;
        if (wantedTypeIds.length > 0 || (regionId !== null && regionId > 0)) {
            const ids = await buildCandidateIds(wantedTypeIds, regionId);
            if (ids.length > 0) candidateIds = ids;
        }
    }

    logger.info("Seeding pokemon pool", {
        needed,
        current,
        target: targetSize,
        constrained: !!candidateIds,
    });
    for (let i = 0; i < needed; i++) {
        await generateAndInsert(candidateIds);
    }
    logger.info("Pool seeded", { added: needed });
}

async function pickNextCandidate(userId: number): Promise<Pokemon | undefined> {
    const wantedTypeIds = getWantedTypeIds(userId);
    const regionId = getUserById(userId)?.regionIdPref ?? null;
    const hasFilters =
        wantedTypeIds.length > 0 || (regionId !== null && regionId > 0);

    if (!hasFilters) return getUnswipedPokemon(userId);

    const candidates = getAllUnswipedPokemon(userId);
    if (candidates.length === 0) return undefined;

    const [typeList, regionSpeciesIds] = await Promise.all([
        wantedTypeIds.length > 0 ? fetchTypeList() : Promise.resolve([]),
        regionId !== null
            ? fetchRegionSpeciesIds(regionId)
            : Promise.resolve(new Set<number>()),
    ]);

    const idToName = new Map(typeList.map((t) => [t.id, t.name]));
    const wantedNames = new Set(
        wantedTypeIds.map((id) => idToName.get(id)).filter(Boolean),
    );

    const speciesResults =
        wantedTypeIds.length > 0
            ? await Promise.all(
                  candidates.map((p) => buildCleanSpeciesData(p.speciesId)),
              )
            : candidates.map(() => null);

    const matching = candidates.filter((p, i) => {
        const typeOk =
            wantedNames.size === 0 ||
            speciesResults[i]?.types.some((t) => wantedNames.has(t));
        const regionOk =
            regionSpeciesIds.size === 0 || regionSpeciesIds.has(p.speciesId);
        return typeOk && regionOk;
    });

    if (matching.length === 0) return undefined;
    return matching[Math.floor(Math.random() * matching.length)];
}

function seedInBackground(targetSize: number, userId: number): void {
    if (process.env.NODE_ENV === "test") return;
    seedPool(targetSize, userId).catch((err) =>
        logger.error("Background pool seeding failed", err),
    );
}

export async function getNextPokemon(userId: number): Promise<PokemonProfile> {
    const unswipedCount = getAllUnswipedPokemon(userId).length;
    if (unswipedCount <= POOL_LOW_THRESHOLD) {
        seedInBackground(getPokemonCount() + POOL_SIZE, userId);
    }

    let pokemon = await pickNextCandidate(userId);

    if (!pokemon) {
        // No matching candidates — seed more for future swipes, show any unswiped now
        seedInBackground(getPokemonCount() + POOL_SIZE, userId);
        pokemon = getUnswipedPokemon(userId);
    }

    if (!pokemon) {
        // Truly empty pool — must block on first seed
        await seedPool(POOL_SIZE, userId);
        pokemon = getUnswipedPokemon(userId);
        if (!pokemon) throw new Error("No pokemon available");
    }

    const speciesData = await buildCleanSpeciesData(pokemon.speciesId);
    if (!speciesData)
        throw new Error(
            `Failed to fetch data for species ${pokemon.speciesId}`,
        );

    return buildProfile(pokemon, speciesData.name, speciesData.types ?? []);
}

function buildProfile(
    pokemon: Pokemon,
    speciesName: string,
    types: string[] = [],
): PokemonProfile {
    return {
        pokemon,
        speciesName,
        types,
        spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`,
        shinySpriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`,
    };
}

export async function getLikedProfiles(
    userId: number,
): Promise<PokemonProfile[]> {
    const liked = getLikedPokemon(userId);
    const profiles = await Promise.all(
        liked.map(async (pokemon) => {
            const speciesData = await buildCleanSpeciesData(pokemon.speciesId);
            return speciesData
                ? buildProfile(
                      pokemon,
                      speciesData.name,
                      speciesData.types ?? [],
                  )
                : null;
        }),
    );
    return profiles.filter((p): p is PokemonProfile => p !== null);
}
