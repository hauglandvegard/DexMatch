import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../src/app';
import { createUser } from '../../src/models/User';
import { insertPokemon } from '../../src/models/Pokemon';
import db from '../../src/database';
import { getNextPokemon } from '../../src/services/pokeService';
import { Gender } from '../../src/types/pokemon.types';

jest.mock('../../src/services/pokeService');

const mockGetNextPokemon = getNextPokemon as jest.MockedFunction<typeof getNextPokemon>;

const TEST_USERNAME = `match_${Date.now() % 100000}`;
const TEST_PASSWORD = 'testpass123';
let TEST_USER_ID: number;
const pokemonIds: number[] = [];

const mockProfile = {
    pokemon: {
        id: 1,
        name: 'Ash',
        speciesId: 25,
        description: 'test',
        gender: Gender.GENDERLESS,
        level: 5,
        size: { weight: 60, height: 4 },
        statsIV: { hp: 15, atk: 15, def: 15, spAtk: 15, spDef: 15, speed: 15 },
        isShiny: false,
        natureId: 0,
        locationId: 0,
    },
    speciesName: 'pikachu',
    types: ['electric'],
    spriteUrl: 'https://example.com/sprite.png',
    shinySpriteUrl: 'https://example.com/shiny.png',
};

function createTestPokemon(speciesId: number) {
    const pokemon = insertPokemon({
        name: `TestMon${speciesId}`,
        speciesId,
        locationId: 0,
        gender: Gender.GENDERLESS,
        description: 'test',
        level: 5,
        size: { weight: 60, height: 4 },
        statsIV: { hp: 15, atk: 15, def: 15, spAtk: 15, spDef: 15, speed: 15 },
        isShiny: false,
        natureId: 0,
    });
    pokemonIds.push(pokemon.id);
    return pokemon;
}

async function loginAgent() {
    const agent = request.agent(app);
    await agent.post('/login').send({ username: TEST_USERNAME, password: TEST_PASSWORD });
    return agent;
}

beforeAll(() => {
    const hash = bcrypt.hashSync(TEST_PASSWORD, 1);
    TEST_USER_ID = createUser(TEST_USERNAME, hash);
});

afterAll(() => {
    db.prepare('DELETE FROM USERS WHERE id = ?').run(TEST_USER_ID);
    if (pokemonIds.length) {
        db.prepare(`DELETE FROM POKEMON WHERE id IN (${pokemonIds.map(() => '?').join(',')})`)
            .run(...pokemonIds);
    }
});

beforeEach(() => {
    jest.clearAllMocks();
    mockGetNextPokemon.mockResolvedValue(mockProfile);
});

describe('GET /swipe', () => {
    it('redirects to / when not authenticated', async () => {
        const res = await request(app).get('/swipe');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/');
    });

    it('returns 200 when authenticated', async () => {
        const agent = await loginAgent();
        const res = await agent.get('/swipe');
        expect(res.status).toBe(200);
    });

    it('calls getNextPokemon with userId when authenticated', async () => {
        const agent = await loginAgent();
        await agent.get('/swipe');
        expect(mockGetNextPokemon).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('returns 500 when getNextPokemon throws', async () => {
        mockGetNextPokemon.mockRejectedValue(new Error('API failure'));
        const agent = await loginAgent();
        const res = await agent.get('/swipe');
        expect(res.status).toBe(500);
    });
});

describe('POST /swipe', () => {
    it('redirects to / when not authenticated', async () => {
        const pokemon = createTestPokemon(100);
        const res = await request(app)
            .post('/swipe')
            .send({ pokemonId: pokemon.id, liked: 'true' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/');
    });

    it('creates liked swipe and redirects to /swipe', async () => {
        const pokemon = createTestPokemon(101);
        const agent = await loginAgent();
        const res = await agent.post('/swipe').send({ pokemonId: pokemon.id, liked: 'true' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/swipe');
    });

    it('creates disliked swipe and redirects to /swipe', async () => {
        const pokemon = createTestPokemon(102);
        const agent = await loginAgent();
        const res = await agent.post('/swipe').send({ pokemonId: pokemon.id, liked: 'false' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/swipe');
    });
});
