/*
    Logtic regarding the PokéAPI to be used in the descrition

    Fetch from https://pokeapi.co/api/v2/{query}

    Available queries are:
    - /pokemon/ { pokemon_name or pokemon_id }
    - /region/ { region_id }
    - /evolution-chain/ { pokemon_id }

    From requirements:
    TODO: Each pokémon should have a random human name. I.e. Josh the Charmander
    TODO: Each pokémon should have a picture.
    TODO: Each pokémon should have asic information (e.g. type, weight, skill, height, lvl).
    TODO: Each pokemon will have a Chuck Norris joke as a description.
*/
import { faker } from '@faker-js/faker'
import Pokedex, { PokemonEntry, NamedAPIResource, Pokedex as PokedexType } from 'pokedex-promise-v2';

import { getJokeForType } from './CNService';
import { getUniqueRandomItems } from '../utils/arrayUtils'
import logger from '../utils/logger';

const P = new Pokedex({
    cacheLimit: 60 * 60 * 1000,
    timeout: 5 * 1000
});

function extractIdFromUrl(url: string) {
    return parseInt(url.split('/').filter(Boolean).pop() || '0', 10);
}

export async function getAllRegionalPokemonIds(regionId: number): Promise<number[]>   {
    try {
        const regionData = await P.getRegionByName(regionId);
        const pokedexUrls = regionData.pokedexes.map((dex: NamedAPIResource) => dex.url);

        logger.debug(`Found ${pokedexUrls.length} pokedex urls`);

        if (pokedexUrls.length === 0) {
            return [];
        }

        const pokedexResponses = await P.getResource(pokedexUrls);

        logger.debug(`Extracted ${pokedexResponses.length} pokedexes`);

        const allPokedexes = Array.isArray(pokedexResponses)
            ? pokedexResponses : [pokedexResponses];

        const masterIdSet = new Set<number>();

        allPokedexes.forEach((pokedex: PokedexType) => {
            pokedex.pokemon_entries.forEach((entry: PokemonEntry) => {
                const id = extractIdFromUrl(entry.pokemon_species.url);
                masterIdSet.add(id);
            });
        });

        logger.debug(`Pokémon ID set size: ${masterIdSet.size}`);

        const sortedIdArray = [...masterIdSet].sort((a, b) => a - b);

        return sortedIdArray;

    } catch (error) {
        logger.error(`Error fetching data for region with id ${regionId}:`, error);
        return [];
    }
}
