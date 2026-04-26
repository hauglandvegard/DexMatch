/*
    The connection point between the PokéAPI and the application.

    Interesting data:

        Species
        - base_happiness -> int
        - evolves_from_species -> { name: str, url: str }
        - color -> { name: str, url: str }
        - evolution_chain -> url: str
        - shape -> { name: string, url: str }
        - flavor_text_entries -> Array( { flavor_text: str, language: { name: str, url: str} } )

        Pokemon
        - height -> int
        - weight -> int
        - location_area_encounters -> url: str
        - sprites -> TODO: Figure out how to format this
        - stats -> Array( { base_stat: int, stat: { name: str } } )
        - types -> Array( { type: { name: str, url: str } } )

        Regions
        - results -> Array({ name: str, url: str })

        Region
        - id -> int
        - locations -> Array( { name: str, url: str } )
        - name -> str
        - names -> Array( { language: { name: str, url: str }, name: str } )
        - pokedexes -> Array( { name: str, url: str })

        Gender
        - pokemon_species_details -> Array( { pokemon_species: { name: str, url: str } }, rate: int )
          NOTE: rate = x / 8
*/

import Pokedex from "pokedex-promise-v2";

import { PokeStats, CleanSpeciesData } from "../types/pokemon.types";
import logger from "../utils/logger";

const P = new Pokedex({
    cacheLimit: 60 * 60 * 1000,
    timeout: 5 * 1000,
});

async function safeFetch<T>(
    fetcher: () => Promise<T>,
    errorMessage: string,
): Promise<T | null> {
    try {
        return await fetcher();
    } catch (error) {
        logger.error(errorMessage, error);
        return null;
    }
}

export function fetchPokemonById(pokeId: number) {
    return safeFetch(
        () => P.getPokemonByName(pokeId),
        `Failed to fetch pokemon data for ${pokeId}`,
    );
}

export function fetchSpeciesById(pokeId: number) {
    return safeFetch(
        () => P.getPokemonSpeciesByName(pokeId),
        `Failed to fetch species data for ${pokeId}`,
    );
}

export function fetchEvolutionData(url: string) {
    return safeFetch(
        () => P.getResource(url),
        `Failed to fetch evolution data for URL: ${url}`,
    );
}

export function fetchRegionList() {
    return safeFetch(() => P.getRegionsList(), `Failed to fetch region list`);
}

export function fetchRegionById(regionId: number) {
    return safeFetch(
        () => P.getRegionByName(regionId),
        `Failed to fetch region ${regionId}`,
    );
}

const STAT_KEY_MAP: Record<string, keyof PokeStats> = {
    hp: "hp",
    attack: "atk",
    defense: "def",
    "special-attack": "spAtk",
    "special-defense": "spDef",
    speed: "speed",
};

export async function buildCleanSpeciesData(
    speciesId: number,
): Promise<CleanSpeciesData | null> {
    const [pokemonData, speciesData] = await Promise.all([
        fetchPokemonById(speciesId),
        fetchSpeciesById(speciesId),
    ]);

    if (!pokemonData || !speciesData) return null;

    const pd = pokemonData as any;
    const sd = speciesData as any;

    const baseStats: PokeStats = {
        hp: 0,
        atk: 0,
        def: 0,
        spAtk: 0,
        spDef: 0,
        speed: 0,
    };
    for (const s of pd.stats) {
        const key = STAT_KEY_MAP[s.stat.name];
        if (key) baseStats[key] = s.base_stat;
    }

    return {
        id: sd.id,
        name: pd.name,
        baseStats,
        baseSize: { height: pd.height, weight: pd.weight },
        types: pd.types.map((t: any) => t.type.name as string),
        isLegendary: sd.is_legendary,
        minEvolvedLevel: sd.evolves_from_species ? 20 : 1,
        chanceForMale: 0.5,
        locationIds: [],
    };
}
