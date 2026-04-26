import { createSwipe, getSwipesByUserId } from "../../src/models/Swipe";
import { createUser } from "../../src/models/User";
import { insertPokemon } from "../../src/models/Pokemon";
import db from "../../src/database";
import { Gender } from "../../src/types/pokemon.types";

describe("Swipe Model Tests", () => {
    let testUserId: number;
    let testPokemonId1: number;
    let testPokemonId2: number;
    let swipeId1: number;

    beforeAll(() => {
        // Create a test user for swipe interactions
        testUserId = createUser(`swipetest_${Date.now()}`, "hashed_password");

        // Create test pokemons to swipe on
        const pokemon1 = insertPokemon({
            name: "SwipeMon1",
            speciesId: 1,
            locationId: 1,
            gender: Gender.MALE,
            description: "Test description 1",
            level: 5,
            size: { weight: 10, height: 10 },
            statsIV: {
                hp: 10,
                atk: 10,
                def: 10,
                spAtk: 10,
                spDef: 10,
                speed: 10,
            },
            isShiny: false,
            natureId: 1,
        });
        testPokemonId1 = pokemon1.id;

        const pokemon2 = insertPokemon({
            name: "SwipeMon2",
            speciesId: 2,
            locationId: 1,
            gender: Gender.FEMALE,
            description: "Test description 2",
            level: 10,
            size: { weight: 20, height: 20 },
            statsIV: {
                hp: 20,
                atk: 20,
                def: 20,
                spAtk: 20,
                spDef: 20,
                speed: 20,
            },
            isShiny: true,
            natureId: 2,
        });
        testPokemonId2 = pokemon2.id;
    });

    afterAll(() => {
        // Clean up data (Swipes table will clear automatically via CASCADE)
        if (testUserId) {
            db.prepare("DELETE FROM USERS WHERE id = ?").run(testUserId);
        }
        if (testPokemonId1) {
            db.prepare("DELETE FROM POKEMON WHERE id = ?").run(testPokemonId1);
        }
        if (testPokemonId2) {
            db.prepare("DELETE FROM POKEMON WHERE id = ?").run(testPokemonId2);
        }
    });

    describe("createSwipe", () => {
        it("should create a new liked swipe and return its id", () => {
            swipeId1 = createSwipe(testUserId, testPokemonId1, true);
            expect(swipeId1).toBeGreaterThan(0);
        });

        it("should create a new disliked swipe and return its id", () => {
            const swipeId2 = createSwipe(testUserId, testPokemonId2, false);
            expect(swipeId2).toBeGreaterThan(0);
        });

        it("should throw on duplicate swipe for the same user and pokemon", () => {
            expect(() => {
                createSwipe(testUserId, testPokemonId1, false);
            }).toThrow();
        });
    });

    describe("getSwipesByUserId", () => {
        it("should retrieve all swipes for a given user id", () => {
            const swipes = getSwipesByUserId(testUserId);

            expect(swipes).toBeDefined();
            expect(swipes.length).toBe(2);

            // Verify first swipe (liked)
            const swipe1 = swipes.find((s) => s.pokemonId === testPokemonId1);
            expect(swipe1).toBeDefined();
            expect(swipe1?.id).toBe(swipeId1);
            expect(swipe1?.userId).toBe(testUserId);
            expect(swipe1?.isLiked).toBe(true);
            expect(swipe1?.createdAt).toBeDefined();

            // Verify second swipe (disliked)
            const swipe2 = swipes.find((s) => s.pokemonId === testPokemonId2);
            expect(swipe2).toBeDefined();
            expect(swipe2?.userId).toBe(testUserId);
            expect(swipe2?.isLiked).toBe(false);
            expect(swipe2?.createdAt).toBeDefined();
        });

        it("should return an empty array for a user with no swipes", () => {
            const emptySwipes = getSwipesByUserId(-1); // Non-existent user ID
            expect(emptySwipes).toBeDefined();
            expect(emptySwipes.length).toBe(0);
            expect(Array.isArray(emptySwipes)).toBe(true);
        });
    });
});
