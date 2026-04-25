/*
    The connection point between the PokéAPI and the application.

    Interresting data:

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

import logger from "../utils/logger";

const P = new Pokedex({
    cacheLimit: 60 * 60 * 1000,
    timeout: 5 * 1000,
});

/**
 * A generic helper to execute Pokedex API calls safely.
 * @param fetcher A function returning the Pokedex promise.
 * @param errorMessage The message to log if it fails.
 * @returns The data, or null if the request fails.
 */
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

export function fetchPokemonData(pokeId: number) {
    return safeFetch(
        () => P.getPokemonByName(pokeId),
        `Failed to fetch pokemon data for ${pokeId}`,
    );
}

export function fetchSpeciesData(pokeId: number) {
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
    return safeFetch(
        () => P.getRegionsList(),
        `Failed to fetch the list of regions`,
    );
}
