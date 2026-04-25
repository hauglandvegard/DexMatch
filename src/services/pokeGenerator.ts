/*
    Logic regarding generating the pokémon

    From requirements:
    TODO: Each pokémon should have a picture.

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
import { getRandomIndices } from "../utils/arrayUtils";
import {
    Pokemon,
    PokeSize,
    PokeStats,
    CleanSpeciesData,
    Gender,
} from "../types/pokemon.types";
import logger from "../utils/logger";

/**
 * Randomly scales a Pokémon's height and weight based on a shared genetic bell curve.
 * Height features an additional random "wobble" so it doesn't scale perfectly 1:1 with weight.
 * * @param {PokeAttributes} attr - The base attributes object containing initial height and weight.
 * @returns {PokeAttributes} The mutated attributes object with randomized size values.
 */
function randomizeSize(attr: PokeSize): PokeSize {
    const sizeGene = getBellCurveRandom();

    // Weight variance: 0.6x to 1.4x
    const weightMultiplier = sizeGene * (1.4 - 0.6) + 0.6;

    attr.weight = Math.floor(attr.weight * weightMultiplier);

    // Height variance: 0.8x to 1.2x (with a +/- 10% wobble)
    const heightWobble = Math.random() * 0.2 - 0.1;
    const heightMultiplier = sizeGene * (1.2 - 0.8) + 0.8 + heightWobble;

    attr.height = Math.floor(attr.height * heightMultiplier);

    logger.debug("Successfully randomized size", {
        data: {
            weightMult: weightMultiplier,
            weightRes: attr.weight,
            heightMult: heightMultiplier,
            heightRes: attr.height,
        },
    });

    return attr;
}

/**
 * Genaretes individual values for a pokémon that determines it´s individual stats according to
 * Genartion III logic (https://bulbapedia.bulbagarden.net/wiki/Individual_values).
 * * @param {boolean} isLegendary - If true, guarantees three randomly selected stats will have a perfect 31 IV.
 * @returns {PokeStats} An object containing the generated IVs (0-31) mapped to each core stat.
 */
function generateIVs(isLegendary: boolean): PokeStats {
    const ivs = [];

    // If the pokemon is legendary, 3 of the 6 values are automatically 31
    const randomIdxs = isLegendary ? getRandomIndices(6, 3) : [];
    let curRandIdx = 0;
    let stat = 0;

    // Individual stats are given on a value from 0 to 31
    for (let i = 0; i < 6; i++) {
        if (isLegendary && i === randomIdxs[curRandIdx]) {
            stat = 31;
            curRandIdx += 1;
        } else {
            stat = Math.floor(Math.random() * 32);
        }

        ivs.push(stat);
    }

    const statIVs: PokeStats = {
        hp: ivs[0],
        atk: ivs[1],
        def: ivs[2],
        spAtk: ivs[3],
        spDef: ivs[4],
        speed: ivs[5],
    };

    logger.debug("Successfully generated IVs", { data: statIVs });

    return statIVs;
}

/**
 * Generates a random Pokémon level between `minLevel` and 100.
 * Uses a folded bell curve to heavily weight the result closer to `minLevel`.
 * * @param {number} minLevel - The lowest possible level to generate.
 * @returns {number} The generated level, strictly bounded up to 100.
 */
function generateLevel(minLevel: number): number {
    const maxLevel = 100;

    if (minLevel >= maxLevel) {
        logger.error(`MinLevel >= maxLevel: ${minLevel} >= ${maxLevel}`, {
            data: { minLevel: minLevel, maxLevel: maxLevel },
        });
        return maxLevel;
    }

    const baseCurve = getBellCurveRandom();
    const foldedCurve = Math.abs(baseCurve - 0.5) * 2;
    const availableRange = maxLevel - minLevel;
    const addedLevels = Math.floor(foldedCurve * availableRange);

    const level = minLevel + addedLevels;

    logger.debug("Successfully generated level", { data: level });

    return level;
}

/**
 * Determines if a Pokémon is shiny based on a classic 1/4096 probability.
 * * @returns {boolean} `true` if the Pokémon is shiny, `false` otherwise.
 */
function isShiny(): boolean {
    const shinyRate = 4096;
    const roll = Math.floor(Math.random() * shinyRate);

    return roll === 151;
}

/**
 * Generates a random Pokémon nature index.
 * * @returns {number} An integer from 0 to 24, corresponding to the 25 standard natures.
 */
function pickNature(): number {
    return Math.floor(Math.random() * 25);
}

/**
 * Synchronously generates a fully realized, unique individual Pokémon based on base species data.
 * Requires a pre-fetched description (joke) to avoid blocking network calls during generation.
 * * @param {CleanSpeciesData} speciesData - The base rules and stats for the specific Pokémon species.
 * @param {string} chuckNorrisJoke - A pre-fetched string to use as the Pokémon's description.
 * @returns {Pokemon} A complete Pokémon object with randomized IVs, size, level, name, and shiny status.
 */
export default function generatePokemon(
    speciesData: CleanSpeciesData,
    chuckNorrisJoke: string,
): Pokemon {
    const size = randomizeSize(speciesData.size);

    const pokemon: Pokemon = {
        id: 0, // TODO: Set up call to database to get a unique id.
        name: faker.person.firstName(), // REQUIREMENT: Each pokémon should have a random human name. I.e. Josh the Charmander.
        speciesId: speciesData.id,
        nature_id: pickNature(),
        description: chuckNorrisJoke, // REQUIREMENT: Each pokemon will have a Chuck Norris joke as a description.
        level: generateLevel(speciesData.minEvolvedLevel),
        size: size, // REQUIREMENT: Each pokémon should have basic information (e.g. type, weight, skill, height, lvl).
        locationId: 0, // TODO: Implement a random location selection within the region.
        gender: Gender.GENDERLESS, // TODO: Implement gender selection.
        statsIV: generateIVs(speciesData.isLegendary),
        isShiny: isShiny(),
    };

    logger.info(
        `Successfully generated ${pokemon.name} the ${speciesData.name}`,
        { data: pokemon },
    );

    return pokemon;
}
