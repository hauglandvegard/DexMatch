import { generatePokemon } from "../../src/services/pokeGenerator";
import {
    CleanSpeciesData,
    Pokemon,
    PokeAttributes,
} from "../../src/types/pokemon.types";
import { faker } from "@faker-js/faker";
import logger from "../../src/utils/logger";
import { getBellCurveRandom } from "../../src/utils/mathUtils"; // Import the mocked version
import { getRandomIndices } from "../../src/utils/arrayUtils";

// Mock faker
jest.mock("@faker-js/faker", () => ({
    faker: {
        person: {
            firstName: jest.fn(),
        },
    },
}));

// Mock logger
jest.mock("../../src/utils/logger", () => ({
    info: jest.fn(),
}));

// Mock getBellCurveRandom
jest.mock("../../src/utils/mathUtils", () => ({
    getBellCurveRandom: jest.fn(),
}));

// Mock getRandomIndices
jest.mock("../../src/utils/arrayUtils", () => ({
    getRandomIndices: jest.fn(),
}));

describe("generatePokemon", () => {
    let mockSpeciesData: CleanSpeciesData;

    beforeEach(() => {
        // Reset mocks before each test
        (faker.person.firstName as jest.Mock).mockClear();
        (logger.info as jest.Mock).mockClear();
        (getBellCurveRandom as jest.Mock).mockClear();
        (getRandomIndices as jest.Mock).mockClear();

        mockSpeciesData = {
            id: 1,
            name: "Bulbasaur",
            attributs: {
                height: 7,
                weight: 69,
                nature_id: 1,
                isLegendary: false,
            },
            stats: {
                hp: 45,
                atk: 49,
                def: 49,
                spAtk: 65,
                spDef: 65,
                speed: 45,
            },
            isLegendary: false,
            evolvedLevel: 16,
            chanseForMale: 0.875,
            LocationIds: [1, 2, 3],
        };
    });

    afterEach(() => {
        // Restore all spied functions (like Math.random) and reset mocked modules
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    it("should generate a Pokémon with correct species data and a random human name", () => {
        const mockFirstName = "Josh";
        (faker.person.firstName as jest.Mock).mockReturnValue(mockFirstName);
        // Default mocks for randomizeSize to ensure predictable attributes
        (getBellCurveRandom as jest.Mock).mockReturnValue(0.5); // sizeGene = 0.5
        jest.spyOn(Math, "random").mockReturnValue(0.5); // Math.random for heightWobble and IVs

        const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);

        expect(generatedPokemon).toBeDefined();
        expect(generatedPokemon.speciesId).toBe(mockSpeciesData.id);
        expect(generatedPokemon.name).toBe(mockFirstName);

        // Calculate expected attributes based on default mocks (sizeGene=0.5, heightWobble=0)
        // weightMultiplier = 0.5 * (1.4 - 0.6) + 0.6 = 0.5 * 0.8 + 0.6 = 1.0
        // heightWobble = 0.5 * 0.2 - 0.1 = 0.1 - 0.1 = 0
        // heightMultiplier = 0.5 * (1.2 - 0.8) + 0.8 + 0 = 0.5 * 0.4 + 0.8 = 1.0
        const expectedWeight = Math.floor(
            mockSpeciesData.attributs.weight * 1.0,
        ); // 69
        const expectedHeight = Math.floor(
            mockSpeciesData.attributs.height * 1.0,
        ); // 7

        expect(generatedPokemon.attributes.weight).toBe(expectedWeight);
        expect(generatedPokemon.attributes.height).toBe(expectedHeight);
        expect(generatedPokemon.attributes.nature_id).toBe(
            mockSpeciesData.attributs.nature_id,
        );
        expect(generatedPokemon.attributes.isLegendary).toBe(
            mockSpeciesData.attributs.isLegendary,
        );

        // For IVs, Math.random is mocked to 0.5, so 0.5 * 32 = 16
        expect(generatedPokemon.statsIV).toEqual({
            hp: 16,
            atk: 16,
            def: 16,
            spAtk: 16,
            spDef: 16,
            speed: 16,
        });
        expect(generatedPokemon.isShiny).toBe(false);
        expect(generatedPokemon.level).toBe(1);
        expect(generatedPokemon.description).toBe("");
        expect(generatedPokemon.id).toBe(0);
    });

    it("should log the generation of the Pokémon with its name and species name", () => {
        const mockFirstName = "Sarah";
        (faker.person.firstName as jest.Mock).mockReturnValue(mockFirstName);
        // Default mocks for randomizeSize and IVs to prevent calculation errors
        (getBellCurveRandom as jest.Mock).mockReturnValue(0.5);
        jest.spyOn(Math, "random").mockReturnValue(0.5);

        const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);

        expect(logger.info).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledWith(
            `Successfully generated ${mockFirstName} the ${mockSpeciesData.name}`,
            { data: generatedPokemon },
        );
    });

    it("should assign a unique random name for each generated Pokémon", () => {
        (faker.person.firstName as jest.Mock)
            .mockReturnValueOnce("Alice")
            .mockReturnValueOnce("Bob");
        // Default mocks for randomizeSize and IVs
        (getBellCurveRandom as jest.Mock).mockReturnValue(0.5);
        jest.spyOn(Math, "random").mockReturnValue(0.5);

        const pokemon1 = generatePokemon(mockSpeciesData);
        const pokemon2 = generatePokemon(mockSpeciesData);

        expect(pokemon1.name).toBe("Alice");
        expect(pokemon2.name).toBe("Bob");
        expect(pokemon1.name).not.toBe(pokemon2.name);
    });

    describe("randomizeSize effects (indirectly via generatePokemon)", () => {
        let initialAttributes: PokeAttributes;

        beforeEach(() => {
            // Create a fresh copy of attributes for each test in this suite
            initialAttributes = { ...mockSpeciesData.attributs };
            // Ensure IVs are predictable even when testing size randomization
            jest.spyOn(Math, "random").mockReturnValue(0.5); // For IVs and heightWobble
        });

        it("should decrease weight and height for smallest sizeGene and heightWobble", () => {
            (getBellCurveRandom as jest.Mock).mockReturnValue(0); // sizeGene = 0
            jest.spyOn(Math, "random")
                .mockReturnValueOnce(0) // Math.random for heightWobble
                .mockReturnValue(0.5); // Math.random for IVs

            const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);
            const modifiedAttributes = generatedPokemon.attributes;

            // Weight multiplier = 0 * (1.4 - 0.6) + 0.6 = 0.6
            // Expected weight = floor(initialWeight * 0.6) = floor(69 * 0.6) = floor(41.4) = 41
            expect(modifiedAttributes.weight).toBe(41);
            expect(modifiedAttributes.weight).toBeLessThan(
                initialAttributes.weight,
            );

            // Height multiplier = 0 * (1.2 - 0.8) + 0.8 + (-0.1) = 0.7
            // Expected height = floor(initialHeight * 0.7) = floor(7 * 0.7) = floor(4.9) = 4
            expect(modifiedAttributes.height).toBe(4);
            expect(modifiedAttributes.height).toBeLessThan(
                initialAttributes.height,
            );
        });

        it("should increase weight and height for largest sizeGene and heightWobble", () => {
            (getBellCurveRandom as jest.Mock).mockReturnValue(1); // sizeGene = 1
            jest.spyOn(Math, "random")
                .mockReturnValueOnce(0.999) // Math.random for heightWobble
                .mockReturnValue(0.5); // Math.random for IVs
            // 0.999 * 0.2 - 0.1 = 0.1998 - 0.1 = 0.0998

            const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);
            const modifiedAttributes = generatedPokemon.attributes;

            // Weight multiplier = 1 * (1.4 - 0.6) + 0.6 = 1.4
            // Expected weight = floor(initialWeight * 1.4) = floor(96.6) = 96
            expect(modifiedAttributes.weight).toBe(96);
            expect(modifiedAttributes.weight).toBeGreaterThan(
                initialAttributes.weight,
            );

            // Height multiplier = 1 * (1.2 - 0.8) + 0.8 + 0.0998 = 1.2998
            // Expected height = floor(initialHeight * 1.2998) = floor(9.0986) = 9
            expect(modifiedAttributes.height).toBe(9);
            expect(modifiedAttributes.height).toBeGreaterThan(
                initialAttributes.height,
            );
        });

        it("should return approximately original weight and height for middle sizeGene and zero heightWobble", () => {
            (getBellCurveRandom as jest.Mock).mockReturnValue(0.5); // sizeGene = 0.5
            jest.spyOn(Math, "random")
                .mockReturnValueOnce(0.5) // Math.random for heightWobble
                .mockReturnValue(0.5); // Math.random for IVs

            const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);
            const modifiedAttributes = generatedPokemon.attributes;

            // Weight multiplier = 0.5 * (1.4 - 0.6) + 0.6 = 1.0
            // Expected weight = floor(initialWeight * 1.0) = 69
            expect(modifiedAttributes.weight).toBe(69);
            expect(modifiedAttributes.weight).toBe(initialAttributes.weight);

            // Height multiplier = 0.5 * (1.2 - 0.8) + 0.8 + 0 = 1.0
            // Expected height = floor(initialHeight * 1.0) = 7
            expect(modifiedAttributes.height).toBe(7);
            expect(modifiedAttributes.height).toBe(initialAttributes.height);
        });

        it("should not modify other attributes within the PokeAttributes object", () => {
            // Use values that will definitely change height and weight
            (getBellCurveRandom as jest.Mock).mockReturnValue(0.1);
            jest.spyOn(Math, "random")
                .mockReturnValueOnce(0.9) // heightWobble
                .mockReturnValue(0.5); // IVs

            const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);
            const modifiedAttributes = generatedPokemon.attributes;

            expect(modifiedAttributes.nature_id).toBe(
                initialAttributes.nature_id,
            );
            expect(modifiedAttributes.isLegendary).toBe(
                initialAttributes.isLegendary,
            );
            // Ensure height and weight *did* change to confirm the test setup
            expect(modifiedAttributes.weight).not.toBe(
                initialAttributes.weight,
            );
            expect(modifiedAttributes.height).not.toBe(
                initialAttributes.height,
            );
        });

        it("should use Math.floor for weight and height calculations", () => {
            (getBellCurveRandom as jest.Mock).mockReturnValue(0.1); // sizeGene = 0.1
            jest.spyOn(Math, "random")
                .mockReturnValueOnce(0.1) // Math.random for heightWobble
                .mockReturnValue(0.5); // Math.random for IVs

            const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);
            const modifiedAttributes = generatedPokemon.attributes;

            // Weight multiplier = 0.1 * 0.8 + 0.6 = 0.68
            // Expected weight = floor(69 * 0.68) = floor(46.92) = 46
            expect(modifiedAttributes.weight).toBe(46);

            // Height multiplier = 0.1 * 0.4 + 0.8 + (-0.08) = 0.76
            // Expected height = floor(7 * 0.76) = floor(5.32) = 5
            expect(modifiedAttributes.height).toBe(5);
        });
    });

    describe("generatePokemonIVs effects (indirectly via generatePokemon)", () => {
        beforeEach(() => {
            // Default mocks for randomizeSize to prevent calculation errors
            (getBellCurveRandom as jest.Mock).mockReturnValue(0.5);
        });

        it("should generate 6 random IVs between 0 and 31 for a non-legendary Pokémon", () => {
            mockSpeciesData.isLegendary = false;
            // Mock Math.random to return specific values for each IV
            // Mock Math.random to return specific values for heightWobble and then each IV
            jest.spyOn(Math, "random")
                .mockReturnValueOnce(0.5) // For heightWobble in randomizeSize (not directly relevant to IVs test, but consumes one call)
                .mockReturnValueOnce(0.1) // HP: floor(0.1 * 32) = 3
                .mockReturnValueOnce(0.9) // Atk: floor(0.9 * 32) = 28
                .mockReturnValueOnce(0.5) // Def: floor(0.5 * 32) = 16
                .mockReturnValueOnce(0.0) // SpAtk: floor(0.0 * 32) = 0
                .mockReturnValueOnce(0.99) // SpDef: floor(0.99 * 32) = 31
                .mockReturnValueOnce(0.3); // Speed: floor(0.3 * 32) = 9

            const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);

            expect(generatedPokemon.statsIV).toEqual({
                hp: 3,
                atk: 28,
                def: 16,
                spAtk: 0,
                spDef: 31,
                speed: 9,
            });

            Object.values(generatedPokemon.statsIV).forEach((iv) => {
                expect(iv).toBeGreaterThanOrEqual(0);
                expect(iv).toBeLessThanOrEqual(31);
            });
            expect(getRandomIndices).not.toHaveBeenCalled(); // Should not be called for non-legendary
        });

        it("should generate 3 IVs of 31 and 3 random IVs for a legendary Pokémon", () => {
            mockSpeciesData.isLegendary = true;
            (getRandomIndices as jest.Mock).mockReturnValue([0, 2, 5]); // HP, Def, Speed should be 31

            // Mock Math.random for the remaining 3 IVs
            // First mock is for heightWobble, then IVs
            jest.spyOn(Math, "random")
                .mockReturnValueOnce(0.5) // heightWobble
                .mockReturnValueOnce(0.1) // Atk (since HP is 31) -> floor(0.1 * 32) = 3
                .mockReturnValueOnce(0.9) // SpAtk (since Def is 31) -> floor(0.9 * 32) = 28
                .mockReturnValueOnce(0.5); // SpDef (since Speed is 31) -> floor(0.5 * 32) = 16

            const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);

            expect(getRandomIndices).toHaveBeenCalledWith(6, 3);
            expect(generatedPokemon.statsIV).toEqual({
                hp: 31,
                atk: 3,
                def: 31,
                spAtk: 28,
                spDef: 16,
                speed: 31,
            });

            // Verify specific IVs
            expect(generatedPokemon.statsIV.hp).toBe(31);
            expect(generatedPokemon.statsIV.def).toBe(31);
            expect(generatedPokemon.statsIV.speed).toBe(31);

            // Verify random IVs are within range
            expect(generatedPokemon.statsIV.atk).toBeGreaterThanOrEqual(0);
            expect(generatedPokemon.statsIV.atk).toBeLessThanOrEqual(31);
            expect(generatedPokemon.statsIV.spAtk).toBeGreaterThanOrEqual(0);
            expect(generatedPokemon.statsIV.spAtk).toBeLessThanOrEqual(31);
            expect(generatedPokemon.statsIV.spDef).toBeGreaterThanOrEqual(0);
            expect(generatedPokemon.statsIV.spDef).toBeLessThanOrEqual(31);
        });

        it("should always return integer IVs for a legendary Pokémon", () => {
            mockSpeciesData.isLegendary = true;
            (getRandomIndices as jest.Mock).mockReturnValue([0, 1, 2]); // HP, Atk, Def are 31

            // Math.random for heightWobble and remaining 3 IVs
            jest.spyOn(Math, "random")
                .mockReturnValueOnce(0.5)
                .mockReturnValueOnce(0.333) // SpAtk
                .mockReturnValueOnce(0.666) // SpDef
                .mockReturnValueOnce(0.999); // Speed

            const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);

            expect(generatedPokemon.statsIV.hp).toBe(31);
            expect(generatedPokemon.statsIV.atk).toBe(31);
            expect(generatedPokemon.statsIV.def).toBe(31);
            expect(generatedPokemon.statsIV.spAtk).toBe(Math.floor(0.333 * 32)); // 10
            expect(generatedPokemon.statsIV.spDef).toBe(Math.floor(0.666 * 32)); // 21
            expect(generatedPokemon.statsIV.speed).toBe(Math.floor(0.999 * 32)); // 31

            Object.values(generatedPokemon.statsIV).forEach((iv) => {
                expect(iv).toBe(Math.floor(iv)); // Ensure it's an integer
            });
        });
    });
});
