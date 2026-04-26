import { buildCleanSpeciesData, fetchTypeList } from './pokeApi.service';
import getJokeForType from './CNService';
import generatePokemon from './pokeGenerator';
import { insertPokemon, getUnswipedPokemon, getAllUnswipedPokemon, getPokemonCount, getLikedPokemon } from '../models/Pokemon';
import { getWantedTypeIds } from '../models/User';
import { Pokemon } from '../types/pokemon.types';
import logger from '../utils/logger';

const MAX_SPECIES_ID = 898;
const POOL_SIZE = 50;
const POOL_LOW_THRESHOLD = 10;

export interface PokemonProfile {
    pokemon: Pokemon;
    speciesName: string;
    spriteUrl: string;
    shinySpriteUrl: string;
}

async function generateAndInsert(): Promise<void> {
    const speciesId = Math.floor(Math.random() * MAX_SPECIES_ID) + 1;
    const speciesData = await buildCleanSpeciesData(speciesId);
    if (!speciesData) return;
    const primaryType = speciesData.types[0] ?? 'normal';
    const joke = await getJokeForType(primaryType);
    const draft = generatePokemon(speciesData, joke);
    insertPokemon(draft);
}

export async function seedPool(targetSize: number = POOL_SIZE): Promise<void> {
    const current = getPokemonCount();
    const needed = Math.max(0, targetSize - current);
    if (needed === 0) return;
    logger.info(`Seeding pokemon pool`, { needed, current, target: targetSize });
    for (let i = 0; i < needed; i++) {
        await generateAndInsert();
    }
    logger.info(`Pool seeded`, { added: needed });
}

async function pickWithTypeFilter(userId: number): Promise<Pokemon | undefined> {
    const wantedIds = getWantedTypeIds(userId);
    if (wantedIds.length === 0) return getUnswipedPokemon(userId);

    const typeList = await fetchTypeList();
    const idToName = new Map(typeList.map((t) => [t.id, t.name]));
    const wantedNames = new Set(wantedIds.map((id) => idToName.get(id)).filter(Boolean));

    const candidates = getAllUnswipedPokemon(userId);
    if (candidates.length === 0) return undefined;

    const speciesResults = await Promise.all(
        candidates.map((p) => buildCleanSpeciesData(p.speciesId))
    );

    const matching = candidates.filter((_, i) => {
        const data = speciesResults[i];
        return data?.types.some((t) => wantedNames.has(t));
    });

    const pool = matching.length > 0 ? matching : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
}

export async function getNextPokemon(userId: number): Promise<PokemonProfile> {
    if (getPokemonCount() < POOL_LOW_THRESHOLD) {
        await seedPool();
    }

    let pokemon = await pickWithTypeFilter(userId);

    if (!pokemon) {
        await seedPool(getPokemonCount() + POOL_SIZE);
        pokemon = await pickWithTypeFilter(userId);
        if (!pokemon) throw new Error('No pokemon available');
    }

    const speciesData = await buildCleanSpeciesData(pokemon.speciesId);
    if (!speciesData) throw new Error(`Failed to fetch data for species ${pokemon.speciesId}`);

    return buildProfile(pokemon, speciesData.name);
}

function buildProfile(pokemon: Pokemon, speciesName: string): PokemonProfile {
    return {
        pokemon,
        speciesName,
        spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`,
        shinySpriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`,
    };
}

export async function getLikedProfiles(userId: number): Promise<PokemonProfile[]> {
    const liked = getLikedPokemon(userId);
    const profiles = await Promise.all(
        liked.map(async (pokemon) => {
            const speciesData = await buildCleanSpeciesData(pokemon.speciesId);
            return speciesData ? buildProfile(pokemon, speciesData.name) : null;
        })
    );
    return profiles.filter((p): p is PokemonProfile => p !== null);
}
