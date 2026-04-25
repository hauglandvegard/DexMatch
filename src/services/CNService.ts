/*
    Logtic regarding the Chuch Norris jokes to be used in the descrition

    Fetch tailored joke from https://api.chucknorris.io/jokes/search?query={query}
    or a random joke from https://api.chucknorris.io/jokes/random
*/
import axios from "axios";

import logger from "../utils/logger";

const CHUCK_API_BASE = "https://api.chucknorris.io/jokes";

/**
 * Fetches a Chuck Norris joke related to a specific Pokémon type from an external API.
 * Features cascading fallbacks to ensure a joke is always returned.
 * * @param {string} pokemonType - The Pokémon type to use as the search query.
 * @returns {Promise<string>} A promise that resolves to the joke string.
 */
export default async function getJokeForType(
    pokemonType: string,
): Promise<string> {
    try {
        // REQUIRMENT: The joke should be connected to the pokemons type.
        const searchUrl = `${CHUCK_API_BASE}/search?query=${pokemonType}`;

        logger.debug(`Fetching Chuck Norris joke from ${searchUrl}`);

        const searchResponse = await axios.get(searchUrl);

        const results = searchResponse.data.result;

        if (results && results.length > 0) {
            // REQUIRMENT: Jokes should be as random as possible according to their type.
            const randomIndex = Math.floor(Math.random() * results.length);
            return results[randomIndex].value;
        }

        // REQUIREMENT: If there is no joke for the given type fall back to random.
        const randomUrl = `${CHUCK_API_BASE}/random`;

        logger.debug(`Fetching failed. Norris joke from ${searchUrl}`);

        const randomResponse = await axios.get(randomUrl);
        return randomResponse.data.value;
    } catch (error) {
        logger.error(
            `Failed to fetch Chuck Norris joke for type ${pokemonType}:`,
            error,
        );
        return "Chuck Norris caught all 1000+ Pokémon using only a single regular Pokéball.";
    }
}
