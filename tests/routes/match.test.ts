import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../src/app';
import { createUser } from '../../src/models/User';
import db from '../../src/database';
import { Gender, QueuedProfile } from '../../src/types/pokemon.types';

jest.mock('../../src/services/pokeQueue');
jest.mock('../../src/services/pokeService');
jest.mock('../../src/models/Pokemon');
jest.mock('../../src/models/Swipe');

import { popQueue, fillQueueInBackground, invalidateQueue } from '../../src/services/pokeQueue';
import { buildProfileFromQueued, getLikedProfiles } from '../../src/services/pokeService';
import { insertPokemon } from '../../src/models/Pokemon';
import { createSwipe } from '../../src/models/Swipe';

const mockPopQueue = popQueue as jest.MockedFunction<typeof popQueue>;
const mockBuildProfileFromQueued = buildProfileFromQueued as jest.MockedFunction<typeof buildProfileFromQueued>;
const mockInsertPokemon = insertPokemon as jest.MockedFunction<typeof insertPokemon>;
const mockCreateSwipe = createSwipe as jest.MockedFunction<typeof createSwipe>;
const mockGetLikedProfiles = getLikedProfiles as jest.MockedFunction<typeof getLikedProfiles>;
(fillQueueInBackground as jest.MockedFunction<typeof fillQueueInBackground>).mockImplementation(() => {});
(invalidateQueue as jest.MockedFunction<typeof invalidateQueue>).mockImplementation(() => {});

const mockDraft = {
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
};

const mockSpeciesData = {
    id: 25, name: 'pikachu',
    baseStats: { hp: 35, atk: 55, def: 40, spAtk: 50, spDef: 50, speed: 90 },
    baseSize: { height: 4, weight: 60 },
    types: ['electric'], isLegendary: false, minEvolvedLevel: 1, chanceForMale: 0.5, locationIds: [],
};

const mockQueued: QueuedProfile = { draft: mockDraft, speciesData: mockSpeciesData };

const mockProfile = {
    pokemon: { ...mockDraft, id: 0 },
    speciesName: 'pikachu',
    types: ['electric'],
    spriteUrl: 'https://example.com/sprite.png',
    shinySpriteUrl: 'https://example.com/shiny.png',
};

const TEST_USERNAME = `match_${Date.now() % 100000}`;
const TEST_PASSWORD = 'testpass123';
let TEST_USER_ID: number;

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
});

beforeEach(() => {
    jest.clearAllMocks();
    mockPopQueue.mockReturnValue(mockQueued);
    mockBuildProfileFromQueued.mockReturnValue(mockProfile);
    mockInsertPokemon.mockReturnValue({ ...mockDraft, id: 42 });
    mockCreateSwipe.mockReturnValue(1);
    mockGetLikedProfiles.mockResolvedValue([mockProfile]);
    (fillQueueInBackground as jest.MockedFunction<typeof fillQueueInBackground>).mockImplementation(() => {});
    (invalidateQueue as jest.MockedFunction<typeof invalidateQueue>).mockImplementation(() => {});
});

describe('GET /swipe', () => {
    it('redirects to / when not authenticated', async () => {
        const res = await request(app).get('/swipe');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/');
    });

    it('returns 200 when queue has item', async () => {
        const agent = await loginAgent();
        const res = await agent.get('/swipe');
        expect(res.status).toBe(200);
    });

    it('renders loading view when queue empty', async () => {
        mockPopQueue.mockReturnValue(null);
        const agent = await loginAgent();
        const res = await agent.get('/swipe');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Finding your next match');
    });

    it('calls popQueue with userId', async () => {
        const agent = await loginAgent();
        await agent.get('/swipe');
        expect(mockPopQueue).toHaveBeenCalledWith(TEST_USER_ID);
    });
});

describe('POST /swipe', () => {
    it('redirects to / when not authenticated', async () => {
        const res = await request(app).post('/swipe').send({ liked: 'true' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/');
    });

    it('inserts pokemon and records swipe on like', async () => {
        const agent = await loginAgent();
        await agent.get('/swipe');
        const res = await agent.post('/swipe').send({ liked: 'true' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/swipe');
        expect(mockInsertPokemon).toHaveBeenCalledWith(mockDraft);
        expect(mockCreateSwipe).toHaveBeenCalledWith(TEST_USER_ID, 42, true);
    });

    it('discards on pass — no DB write', async () => {
        const agent = await loginAgent();
        await agent.get('/swipe');
        await agent.post('/swipe').send({ liked: 'false' });
        expect(mockInsertPokemon).not.toHaveBeenCalled();
        expect(mockCreateSwipe).not.toHaveBeenCalled();
    });

    it('redirects to /swipe when no pending profile in session', async () => {
        const agent = await loginAgent();
        const res = await agent.post('/swipe').send({ liked: 'true' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/swipe');
        expect(mockInsertPokemon).not.toHaveBeenCalled();
    });
});
