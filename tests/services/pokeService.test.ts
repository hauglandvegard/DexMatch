jest.mock('../../src/services/pokeApi.service');
jest.mock('../../src/services/CNService');
jest.mock('../../src/services/pokeGenerator');
jest.mock('../../src/models/Pokemon');

import { buildCleanSpeciesData } from '../../src/services/pokeApi.service';
import getJokeForType from '../../src/services/CNService';
import generatePokemon from '../../src/services/pokeGenerator';
import { insertPokemon } from '../../src/models/Pokemon';
import { getNextPokemon } from '../../src/services/pokeService';
import { Gender } from '../../src/types/pokemon.types';

const mockBuildClean = buildCleanSpeciesData as jest.MockedFunction<typeof buildCleanSpeciesData>;
const mockGetJoke = getJokeForType as jest.MockedFunction<typeof getJokeForType>;
const mockGenerate = generatePokemon as jest.MockedFunction<typeof generatePokemon>;
const mockInsert = insertPokemon as jest.MockedFunction<typeof insertPokemon>;

const mockSpeciesData = {
    id: 25,
    name: 'pikachu',
    baseStats: { hp: 35, atk: 55, def: 40, spAtk: 50, spDef: 50, speed: 90 },
    baseSize: { height: 4, weight: 60 },
    types: ['electric'],
    isLegendary: false,
    minEvolvedLevel: 1,
    chanceForMale: 0.5,
    locationIds: [],
};

const mockDraft = {
    name: 'Ash',
    speciesId: 25,
    description: 'Chuck Norris once won a Pokemon tournament blindfolded.',
    gender: Gender.GENDERLESS,
    level: 50,
    size: { weight: 60, height: 4 },
    statsIV: { hp: 15, atk: 20, def: 10, spAtk: 25, spDef: 15, speed: 30 },
    isShiny: false,
    natureId: 3,
    locationId: 0,
};

const mockPokemon = { ...mockDraft, id: 42 };

beforeEach(() => {
    jest.clearAllMocks();
    mockBuildClean.mockResolvedValue(mockSpeciesData);
    mockGetJoke.mockResolvedValue(mockDraft.description);
    mockGenerate.mockReturnValue(mockDraft);
    mockInsert.mockReturnValue(mockPokemon);
});

describe('getNextPokemon', () => {
    it('returns profile with pokemon, speciesName, and sprite URLs', async () => {
        const profile = await getNextPokemon();
        expect(profile.pokemon).toEqual(mockPokemon);
        expect(profile.speciesName).toBe('pikachu');
        expect(profile.spriteUrl).toMatch(/\.png$/);
        expect(profile.shinySpriteUrl).toMatch(/\.png$/);
    });

    it('sprite URLs contain the resolved speciesId', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0); // speciesId = 1
        const profile = await getNextPokemon();
        expect(profile.spriteUrl).toContain('/1.png');
        expect(profile.shinySpriteUrl).toContain('/1.png');
    });

    it('throws when buildCleanSpeciesData returns null', async () => {
        mockBuildClean.mockResolvedValue(null);
        await expect(getNextPokemon()).rejects.toThrow();
    });

    it('passes primary type to getJokeForType', async () => {
        await getNextPokemon();
        expect(mockGetJoke).toHaveBeenCalledWith('electric');
    });

    it('falls back to "normal" when types array is empty', async () => {
        mockBuildClean.mockResolvedValue({ ...mockSpeciesData, types: [] });
        await getNextPokemon();
        expect(mockGetJoke).toHaveBeenCalledWith('normal');
    });

    it('passes species data and joke to generatePokemon', async () => {
        await getNextPokemon();
        expect(mockGenerate).toHaveBeenCalledWith(mockSpeciesData, mockDraft.description);
    });

    it('inserts the generated draft into the database', async () => {
        await getNextPokemon();
        expect(mockInsert).toHaveBeenCalledWith(mockDraft);
    });

    it('calls buildCleanSpeciesData with speciesId = 1 when Math.random returns 0', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);
        await getNextPokemon();
        expect(mockBuildClean).toHaveBeenCalledWith(1);
    });

    it('calls buildCleanSpeciesData with speciesId = 898 when Math.random returns ~1', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.9999);
        await getNextPokemon();
        expect(mockBuildClean).toHaveBeenCalledWith(898);
    });
});
