import { faker } from "@faker-js/faker";
import generatePokemon from "../../src/services/pokeGenerator";
import {
    CleanSpeciesData,
    DraftPokemon,
    Gender,
} from "../../src/types/pokemon.types";
import { getBellCurveRandom } from "../../src/utils/mathUtils";
import { getRandomIndices } from "../../src/utils/arrayUtils";
import logger from "../../src/utils/logger";

// Mocking dependencies
jest.mock("@faker-js/faker", () => ({
    faker: {
        person: {
            firstName: jest.fn(),
        },
    },
}));

jest.mock("../../src/utils/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
}));

jest.mock("../../src/utils/mathUtils", () => ({
    getBellCurveRandom: jest.fn(),
}));

jest.mock("../../src/utils/arrayUtils", () => ({
    getRandomIndices: jest.fn(),
}));

describe("generatePokemon", () => {
    let mockSpeciesData: CleanSpeciesData;

    beforeEach(() => {
        // Reset mocks before each test
        (faker.person.firstName as jest.Mock).mockClear();
        (logger.info as jest.Mock).mockClear();
        (logger.debug as jest.Mock).mockClear();
        (logger.error as jest.Mock).mockClear();
        (getBellCurveRandom as jest.Mock).mockClear();
        (getRandomIndices as jest.Mock).mockClear();

        mockSpeciesData = {
            id: 1,
            name: "Bulbasaur",
            baseSize: {
                height: 7,
                weight: 69,
            },
            baseStats: {
                hp: 45,
                atk: 49,
                def: 49,
                spAtk: 65,
                spDef: 65,
                speed: 45,
            },
            types: ["Grass", "Poison"],
            isLegendary: false,
            minEvolvedLevel: 16,
            chanceForMale: 0.875,
            locationIds: [1, 2, 3],
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should generate a Pokémon with correct species data and a random human name", () => {
        const mockFirstName = "Josh";
        const mockJoke = "Chuck Norris caught all Pokémon. With a landline.";
        (faker.person.firstName as jest.Mock).mockReturnValue(mockFirstName);
        (getBellCurveRandom as jest.Mock).mockReturnValue(0.5);
        jest.spyOn(Math, "random").mockReturnValue(0.5);

        const generatedPokemon: DraftPokemon = generatePokemon(
            mockSpeciesData,
            mockJoke,
        );

        expect(generatedPokemon).toBeDefined();
        expect(generatedPokemon.speciesId).toBe(mockSpeciesData.id);
        expect(generatedPokemon.name).toBe(mockFirstName);

        const expectedWeight = Math.floor(
            mockSpeciesData.baseSize.weight * 1.0,
        );
        const expectedHeight = Math.floor(
            mockSpeciesData.baseSize.height * 1.0,
        );

        expect(generatedPokemon.size.weight).toBe(expectedWeight);
        expect(generatedPokemon.size.height).toBe(expectedHeight);

        expect(generatedPokemon.statsIV).toEqual({
            hp: 16,
            atk: 16,
            def: 16,
            spAtk: 16,
            spDef: 16,
            speed: 16,
        });

        expect(generatedPokemon.description).toBe(mockJoke);
    });

    it("should log the generation of the Pokémon with its name and species name", () => {
        const mockFirstName = "Josh";
        const mockJoke =
            "Chuck Norris once won a game of Connect Four in three moves.";
        (faker.person.firstName as jest.Mock).mockReturnValue(mockFirstName);
        (getBellCurveRandom as jest.Mock).mockReturnValue(0.5);
        jest.spyOn(Math, "random").mockReturnValue(0.5);

        const generatedPokemon: DraftPokemon = generatePokemon(
            mockSpeciesData,
            mockJoke,
        );

        expect(logger.info).toHaveBeenCalledWith(
            `Successfully generated ${mockFirstName} the ${mockSpeciesData.name}`,
            { data: generatedPokemon },
        );
    });

    describe("randomizeSize effects", () => {
        it("should decrease weight and height for smallest sizeGene and heightWobble", () => {
            (getBellCurveRandom as jest.Mock).mockReturnValue(0);
            jest.spyOn(Math, "random").mockReturnValue(0);

            const generatedPokemon: DraftPokemon = generatePokemon(
                mockSpeciesData,
                "Joke",
            );

            expect(generatedPokemon.size.weight).toBe(
                Math.floor(mockSpeciesData.baseSize.weight * 0.6),
            );
            expect(generatedPokemon.size.height).toBe(
                Math.floor(mockSpeciesData.baseSize.height * 0.7),
            );
        });
    });

    describe("generateIVs effects", () => {
        it("should generate 3 IVs of 31 for legendary Pokémon", () => {
            const legendaryData = { ...mockSpeciesData, isLegendary: true };
            (getRandomIndices as jest.Mock).mockReturnValue([0, 2, 4]);
            jest.spyOn(Math, "random").mockReturnValue(0.5);

            const generatedPokemon: DraftPokemon = generatePokemon(
                legendaryData,
                "Joke",
            );

            expect(generatedPokemon.statsIV.hp).toBe(31);
            expect(generatedPokemon.statsIV.def).toBe(31);
            expect(generatedPokemon.statsIV.spDef).toBe(31);
            expect(generatedPokemon.statsIV.atk).toBe(16);
        });
    });

    describe("pickNature effects", () => {
        it("should generate a natureId between 0 and 24", () => {
            jest.spyOn(Math, "random").mockReturnValue(0.8);
            const pokemon = generatePokemon(mockSpeciesData, "Joke");
            expect(pokemon.natureId).toBe(20);
        });
    });

    describe("isShiny effects", () => {
        it("should mark pokemon as shiny when roll is 151", () => {
            jest.spyOn(Math, "random").mockReturnValue(151 / 4096);
            const pokemon = generatePokemon(mockSpeciesData, "Joke");
            expect(pokemon.isShiny).toBe(true);
        });
    });
});
