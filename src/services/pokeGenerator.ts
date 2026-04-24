/*
    Logic regarding generating the pokémon

    From requirements:
    TODO: Each pokémon should have a picture.
    TODO: Each pokémon should have asic information (e.g. type, weight, skill, height, lvl).
    TODO: Each pokemon will have a Chuck Norris joke as a description.

    Static pokémon attributes:
    - Base stats
    - Types
    - Abilities
    - Evolution Path
    - Catch Rate

    Randomized attributes:
    - IVs
    - Nature
    - Gender
    - Shininess
    - Ability Slot
    - Size
    - Weight
*/

import { faker } from "@faker-js/faker";

import { Pokemon, CleanSpeciesData } from "../types/pokemon.types";
import logger from "../utils/logger";

export function generatePokemon(speciesData: CleanSpeciesData): Pokemon {
    const pokemon: Pokemon = {
        id: 0, // TODO: Set up call to database to get a unique id
        name: faker.person.firstName(), // REQUIREMENT: Each pokémon should have a random human name. I.e. Josh the Charmander
        speciesId: speciesData.id,
        description: "", // TODO: Set up the Chuck Norries joke import
        level: 1, // TODO: Implement function to calculate level
        attributes: speciesData.attributs, // TODO: Calculate attributes
        statsIV: speciesData.stats, // TODO: Calculate IVs
        isShiny: false, // TODO: Implement function to calculate if shiny
    };

    logger.info(
        `Successfully generated ${pokemon.name} the ${speciesData.name}`,
        { data: pokemon },
    );

    return pokemon;
}
