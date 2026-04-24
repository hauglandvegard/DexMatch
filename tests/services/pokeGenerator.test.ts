import { generatePokemon } from "../../src/services/pokeGenerator";
import { CleanSpeciesData, Pokemon } from "../../src/types/pokemon.types";
import { faker } from "@faker-js/faker";
import logger from "../../src/utils/logger";

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

describe("generatePokemon", () => {
    let mockSpeciesData: CleanSpeciesData;

    beforeEach(() => {
        // Reset mocks before each test
        (faker.person.firstName as jest.Mock).mockClear();
        (logger.info as jest.Mock).mockClear();

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

    it("should generate a Pokémon with correct species data and a random human name", () => {
        const mockFirstName = "Josh";
        (faker.person.firstName as jest.Mock).mockReturnValue(mockFirstName);

        const generatedPokemon: Pokemon = generatePokemon(mockSpeciesData);

        expect(generatedPokemon).toBeDefined();
        expect(generatedPokemon.speciesId).toBe(mockSpeciesData.id);
        expect(generatedPokemon.name).toBe(mockFirstName);
        expect(generatedPokemon.attributes).toEqual(mockSpeciesData.attributs);
        expect(generatedPokemon.statsIV).toEqual(mockSpeciesData.stats);
        expect(generatedPokemon.isShiny).toBe(false);
        expect(generatedPokemon.level).toBe(1);
        expect(generatedPokemon.description).toBe("");
        expect(generatedPokemon.id).toBe(0);
    });

    it("should log the generation of the Pokémon with its name and species name", () => {
        const mockFirstName = "Sarah";
        (faker.person.firstName as jest.Mock).mockReturnValue(mockFirstName);

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

        const pokemon1 = generatePokemon(mockSpeciesData);
        const pokemon2 = generatePokemon(mockSpeciesData);

        expect(pokemon1.name).toBe("Alice");
        expect(pokemon2.name).toBe("Bob");
        expect(pokemon1.name).not.toBe(pokemon2.name);
    });
});
