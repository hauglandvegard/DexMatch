jest.mock('../../src/services/pokeApi.service');
jest.mock('../../src/services/CNService');
jest.mock('../../src/services/pokeGenerator');
jest.mock('../../src/models/Pokemon');
jest.mock('../../src/models/User');

import { buildCleanSpeciesData, fetchTypeList, fetchRegionSpeciesIds } from '../../src/services/pokeApi.service';
import getJokeForType from '../../src/services/CNService';
import generatePokemon from '../../src/services/pokeGenerator';
import { insertPokemon, getUnswipedPokemon, getAllUnswipedPokemon, getPokemonCount } from '../../src/models/Pokemon';
import { getWantedTypeIds, getUserById } from '../../src/models/User';
import { getNextPokemon, seedPool } from '../../src/services/pokeService';
import { Gender } from '../../src/types/pokemon.types';

const mockBuildClean = buildCleanSpeciesData as jest.MockedFunction<typeof buildCleanSpeciesData>;
const mockFetchTypeList = fetchTypeList as jest.MockedFunction<typeof fetchTypeList>;
const mockFetchRegionSpeciesIds = fetchRegionSpeciesIds as jest.MockedFunction<typeof fetchRegionSpeciesIds>;
const mockGetJoke = getJokeForType as jest.MockedFunction<typeof getJokeForType>;
const mockGenerate = generatePokemon as jest.MockedFunction<typeof generatePokemon>;
const mockInsert = insertPokemon as jest.MockedFunction<typeof insertPokemon>;
const mockGetUnswiped = getUnswipedPokemon as jest.MockedFunction<typeof getUnswipedPokemon>;
const mockGetAllUnswiped = getAllUnswipedPokemon as jest.MockedFunction<typeof getAllUnswipedPokemon>;
const mockGetCount = getPokemonCount as jest.MockedFunction<typeof getPokemonCount>;
const mockGetWantedTypeIds = getWantedTypeIds as jest.MockedFunction<typeof getWantedTypeIds>;
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;

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
    mockFetchTypeList.mockResolvedValue([]);
    mockFetchRegionSpeciesIds.mockResolvedValue(new Set());
    mockGetJoke.mockResolvedValue(mockDraft.description);
    mockGenerate.mockReturnValue(mockDraft);
    mockInsert.mockReturnValue(mockPokemon);
    mockGetUnswiped.mockReturnValue(mockPokemon);
    mockGetAllUnswiped.mockReturnValue([mockPokemon]);
    mockGetCount.mockReturnValue(50);
    mockGetWantedTypeIds.mockReturnValue([]);
    mockGetUserById.mockReturnValue({ id: 1, username: 'test', displayName: null, passwordHash: '', regionIdPref: null, themeId: 0 });
});

describe('getNextPokemon', () => {
    it('returns profile with pokemon from pool', async () => {
        const profile = await getNextPokemon(1);
        expect(profile.pokemon).toEqual(mockPokemon);
        expect(profile.speciesName).toBe('pikachu');
        expect(profile.spriteUrl).toMatch(/\.png$/);
        expect(profile.shinySpriteUrl).toMatch(/\.png$/);
    });

    it('sprite URLs use pokemon speciesId', async () => {
        const profile = await getNextPokemon(1);
        expect(profile.spriteUrl).toContain('/25.png');
        expect(profile.shinySpriteUrl).toContain('/25.png');
    });

    it('calls getUnswipedPokemon with userId', async () => {
        await getNextPokemon(7);
        expect(mockGetUnswiped).toHaveBeenCalledWith(7);
    });

    it('seeds pool when count is below threshold', async () => {
        mockGetCount.mockReturnValue(5);
        mockGetUnswiped.mockReturnValueOnce(undefined).mockReturnValue(mockPokemon);
        await getNextPokemon(1);
        expect(mockInsert).toHaveBeenCalled();
    });

    it('generates more when no unswiped pokemon', async () => {
        mockGetUnswiped.mockReturnValueOnce(undefined).mockReturnValue(mockPokemon);
        await getNextPokemon(1);
        expect(mockInsert).toHaveBeenCalled();
    });

    it('throws when no pokemon available after seeding', async () => {
        mockGetUnswiped.mockReturnValue(undefined);
        await expect(getNextPokemon(1)).rejects.toThrow('No pokemon available');
    });

    it('throws when buildCleanSpeciesData returns null for display', async () => {
        mockBuildClean.mockResolvedValue(null);
        await expect(getNextPokemon(1)).rejects.toThrow();
    });

    it('uses getUnswipedPokemon when no filters set', async () => {
        await getNextPokemon(1);
        expect(mockGetUnswiped).toHaveBeenCalledWith(1);
        expect(mockGetAllUnswiped).not.toHaveBeenCalled();
    });

    it('filters by region — returns matching pokemon', async () => {
        mockGetUserById.mockReturnValue({ id: 1, username: 'test', displayName: null, passwordHash: '', regionIdPref: 2, themeId: 0 });
        mockFetchRegionSpeciesIds.mockResolvedValue(new Set([25]));
        mockGetAllUnswiped.mockReturnValue([mockPokemon]);

        const profile = await getNextPokemon(1);
        expect(profile.pokemon).toEqual(mockPokemon);
        expect(mockFetchRegionSpeciesIds).toHaveBeenCalledWith(2);
    });

    it('falls back to full pool when no pokemon match region filter', async () => {
        const otherPokemon = { ...mockPokemon, speciesId: 99 };
        mockGetUserById.mockReturnValue({ id: 1, username: 'test', displayName: null, passwordHash: '', regionIdPref: 2, themeId: 0 });
        mockFetchRegionSpeciesIds.mockResolvedValue(new Set([1, 2, 3]));
        mockGetAllUnswiped.mockReturnValue([otherPokemon]);

        const profile = await getNextPokemon(1);
        expect(profile.pokemon).toEqual(otherPokemon);
    });

    it('filters by type — returns matching pokemon', async () => {
        mockGetWantedTypeIds.mockReturnValue([13]);
        mockFetchTypeList.mockResolvedValue([{ id: 13, name: 'electric' }]);
        mockGetAllUnswiped.mockReturnValue([mockPokemon]);

        const profile = await getNextPokemon(1);
        expect(profile.pokemon).toEqual(mockPokemon);
        expect(mockFetchTypeList).toHaveBeenCalled();
    });
});

describe('seedPool', () => {
    it('does not insert when pool already at target', async () => {
        mockGetCount.mockReturnValue(50);
        await seedPool(50);
        expect(mockInsert).not.toHaveBeenCalled();
    });

    it('inserts the needed number of pokemon', async () => {
        mockGetCount.mockReturnValue(48);
        await seedPool(50);
        expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('skips insert when buildCleanSpeciesData returns null', async () => {
        mockGetCount.mockReturnValue(49);
        mockBuildClean.mockResolvedValue(null);
        await seedPool(50);
        expect(mockInsert).not.toHaveBeenCalled();
    });
});
