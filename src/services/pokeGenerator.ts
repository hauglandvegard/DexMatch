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

import { getBellCurveRandom } from "../utils/mathUtils";
import {
    Pokemon,
    PokeAttributes,
    CleanSpeciesData,
} from "../types/pokemon.types";
import logger from "../utils/logger";

/**
 * Gives each pokémon a bit more uniqueness by randomizing their size.
 * * @param attr - The pokémon's attributes to be modified
 * @returns A modified version of the attributes
 */
function randomizeSize(attr: PokeAttributes): PokeAttributes {
    const sizeGene = getBellCurveRandom();

    // Weight variance: 0.6x to 1.4x
    const weightMultiplier = sizeGene * (1.4 - 0.6) + 0.6;

    attr.weight = Math.floor(attr.weight * weightMultiplier);

    // Height variance: 0.8x to 1.2x (with a +/- 10% wobble)
    const heightWobble = Math.random() * 0.2 - 0.1;
    const heightMultiplier = sizeGene * (1.2 - 0.8) + 0.8 + heightWobble;

    attr.height = Math.floor(attr.height * heightMultiplier);

    return attr;
}

export function generatePokemon(speciesData: CleanSpeciesData): Pokemon {
    const attr = randomizeSize(speciesData.attributs);

    const pokemon: Pokemon = {
        id: 0, // TODO: Set up call to database to get a unique id
        name: faker.person.firstName(), // REQUIREMENT: Each pokémon should have a random human name. I.e. Josh the Charmander
        speciesId: speciesData.id,
        description: "", // TODO: Set up the Chuck Norries joke import
        level: 1, // TODO: Implement function to calculate level
        attributes: attr,
        statsIV: speciesData.stats, // TODO: Calculate IVs
        isShiny: false, // TODO: Implement function to calculate if shiny
    };

    logger.info(
        `Successfully generated ${pokemon.name} the ${speciesData.name}`,
        { data: pokemon },
    );

    return pokemon;
}
