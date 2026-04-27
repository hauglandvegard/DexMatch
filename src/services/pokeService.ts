import { buildCleanSpeciesData } from './pokeApi.service';
import { getLikedPokemon } from '../models/Pokemon';
import { Pokemon, QueuedProfile } from '../types/pokemon.types';
import { popQueue, fillQueueInBackground } from './pokeQueue';

export interface PokemonProfile {
    pokemon: Pokemon;
    speciesName: string;
    types: string[];
    spriteUrl: string;
    shinySpriteUrl: string;
}

export function buildProfileFromQueued(queued: QueuedProfile): PokemonProfile {
    const { draft, speciesData } = queued;
    return {
        pokemon: { ...draft, id: 0 },
        speciesName: speciesData.name,
        types: speciesData.types ?? [],
        spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${draft.speciesId}.png`,
        shinySpriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${draft.speciesId}.png`,
    };
}

export function getNextPokemon(userId: number): PokemonProfile | null {
    const queued = popQueue(userId);
    fillQueueInBackground(userId);
    if (!queued) return null;
    return buildProfileFromQueued(queued);
}

function buildProfile(pokemon: Pokemon, speciesName: string, types: string[] = []): PokemonProfile {
    return {
        pokemon,
        speciesName,
        types,
        spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`,
        shinySpriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`,
    };
}

export async function getLikedProfiles(userId: number): Promise<PokemonProfile[]> {
    const liked = getLikedPokemon(userId);
    const profiles = await Promise.all(
        liked.map(async (pokemon) => {
            const speciesData = await buildCleanSpeciesData(pokemon.speciesId);
            return speciesData ? buildProfile(pokemon, speciesData.name, speciesData.types ?? []) : null;
        })
    );
    return profiles.filter((p): p is PokemonProfile => p !== null);
}
