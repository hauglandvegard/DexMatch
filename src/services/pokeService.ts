import { buildCleanSpeciesData } from './pokeApi.service';
import getJokeForType from './CNService';
import generatePokemon from './pokeGenerator';
import { insertPokemon } from '../models/Pokemon';
import { Pokemon } from '../types/pokemon.types';

const MAX_SPECIES_ID = 898;

export interface PokemonProfile {
    pokemon: Pokemon;
    speciesName: string;
    spriteUrl: string;
    shinySpriteUrl: string;
}

export async function getNextPokemon(): Promise<PokemonProfile> {
    const speciesId = Math.floor(Math.random() * MAX_SPECIES_ID) + 1;

    const speciesData = await buildCleanSpeciesData(speciesId);
    if (!speciesData) throw new Error(`Failed to fetch data for species ${speciesId}`);

    const primaryType = speciesData.types[0] ?? 'normal';
    const joke = await getJokeForType(primaryType);

    const draft = generatePokemon(speciesData, joke);
    const pokemon = insertPokemon(draft);

    return {
        pokemon,
        speciesName: speciesData.name,
        spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`,
        shinySpriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${speciesId}.png`,
    };
}
