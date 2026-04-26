import { buildCleanSpeciesData } from './pokeApi.service';
import getJokeForType from './CNService';
import generatePokemon from './pokeGenerator';
import { insertPokemon, getUnswipedPokemon, getPokemonCount, getLikedPokemon } from '../models/Pokemon';
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

export async function getNextPokemon(userId: number): Promise<PokemonProfile> {
    if (getPokemonCount() < POOL_LOW_THRESHOLD) {
        await seedPool();
    }

    let pokemon = getUnswipedPokemon(userId);

    if (!pokemon) {
        await seedPool(getPokemonCount() + POOL_SIZE);
        pokemon = getUnswipedPokemon(userId);
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
