import { insertPokemon, getPokemonById } from "../../src/models/Pokemon";
import db from "../../src/database";
import { Gender, DraftPokemon } from "../../src/types/pokemon.types";

describe("Pokemon Model Tests", () => {
    let testPokemonId: number;

    const mockPokemonData: DraftPokemon = {
        name: "Testmander",
        speciesId: 4,
        locationId: 10,
        gender: Gender.MALE,
        description: "A test pokemon description.",
        level: 5,
        size: {
            weight: 85,
            height: 6,
        },
        statsIV: {
            hp: 31,
            atk: 25,
            def: 20,
            spAtk: 15,
            spDef: 10,
            speed: 5,
        },
        isShiny: true,
        natureId: 3,
    };

    afterAll(() => {
        if (testPokemonId) {
            db.prepare("DELETE FROM POKEMON WHERE id = ?").run(testPokemonId);
        }
    });

    describe("insertPokemon", () => {
        it("should insert a new pokemon and return the pokemon object with id", () => {
            const pokemon = insertPokemon(mockPokemonData);
            testPokemonId = pokemon.id;
            expect(testPokemonId).toBeGreaterThan(0);
            expect(pokemon.name).toBe(mockPokemonData.name);
        });
    });

    describe("getPokemonById", () => {
        it("should retrieve a pokemon by its id with correctly mapped fields", () => {
            const pokemon = getPokemonById(testPokemonId);

            expect(pokemon).toBeDefined();
            expect(pokemon?.id).toBe(testPokemonId);
            expect(pokemon?.name).toBe(mockPokemonData.name);
            expect(pokemon?.speciesId).toBe(mockPokemonData.speciesId);
            expect(pokemon?.locationId).toBe(mockPokemonData.locationId);
            expect(pokemon?.gender).toBe(mockPokemonData.gender);
            expect(pokemon?.level).toBe(mockPokemonData.level);
            expect(pokemon?.size.weight).toBe(mockPokemonData.size.weight);
            expect(pokemon?.size.height).toBe(mockPokemonData.size.height);
            expect(pokemon?.statsIV.hp).toBe(mockPokemonData.statsIV.hp);
            expect(pokemon?.statsIV.atk).toBe(mockPokemonData.statsIV.atk);
            expect(pokemon?.statsIV.def).toBe(mockPokemonData.statsIV.def);
            expect(pokemon?.statsIV.spAtk).toBe(mockPokemonData.statsIV.spAtk);
            expect(pokemon?.statsIV.spDef).toBe(mockPokemonData.statsIV.spDef);
            expect(pokemon?.statsIV.speed).toBe(mockPokemonData.statsIV.speed);
            expect(pokemon?.isShiny).toBe(mockPokemonData.isShiny);
            expect(pokemon?.natureId).toBe(mockPokemonData.natureId);
            expect(pokemon?.description).toBe(mockPokemonData.description);
        });

        it("should return undefined for a non-existent id", () => {
            const pokemon = getPokemonById(-1);
            expect(pokemon).toBeUndefined();
        });
    });
});
