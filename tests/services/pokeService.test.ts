jest.mock('../../src/services/pokeQueue');
jest.mock('../../src/services/pokeApi.service');
jest.mock('../../src/models/Pokemon');

import { popQueue, fillQueueInBackground } from '../../src/services/pokeQueue';
import { buildCleanSpeciesData } from '../../src/services/pokeApi.service';
import { getLikedPokemon } from '../../src/models/Pokemon';
import { getNextPokemon, getLikedProfiles, buildProfileFromQueued } from '../../src/services/pokeService';
import { Gender, QueuedProfile } from '../../src/types/pokemon.types';

const mockPopQueue = popQueue as jest.MockedFunction<typeof popQueue>;
const mockFillQueueInBackground = fillQueueInBackground as jest.MockedFunction<typeof fillQueueInBackground>;
const mockBuildClean = buildCleanSpeciesData as jest.MockedFunction<typeof buildCleanSpeciesData>;
const mockGetLikedPokemon = getLikedPokemon as jest.MockedFunction<typeof getLikedPokemon>;

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

const mockQueued: QueuedProfile = { draft: mockDraft, speciesData: mockSpeciesData };
const mockPokemon = { ...mockDraft, id: 42 };

beforeEach(() => {
    jest.clearAllMocks();
    mockPopQueue.mockReturnValue(mockQueued);
    mockFillQueueInBackground.mockImplementation(() => {});
    mockBuildClean.mockResolvedValue(mockSpeciesData);
    mockGetLikedPokemon.mockReturnValue([mockPokemon]);
});

describe('getNextPokemon', () => {
    it('returns null when queue empty', () => {
        mockPopQueue.mockReturnValue(null);
        expect(getNextPokemon(1)).toBeNull();
    });

    it('returns profile when queue has item', () => {
        const profile = getNextPokemon(1);
        expect(profile).not.toBeNull();
        expect(profile!.speciesName).toBe('pikachu');
        expect(profile!.types).toEqual(['electric']);
    });

    it('sprite URLs use speciesId', () => {
        const profile = getNextPokemon(1);
        expect(profile!.spriteUrl).toContain('/25.png');
        expect(profile!.shinySpriteUrl).toContain('/25.png');
    });

    it('calls fillQueueInBackground with userId', () => {
        getNextPokemon(7);
        expect(mockFillQueueInBackground).toHaveBeenCalledWith(7);
    });
});

describe('buildProfileFromQueued', () => {
    it('builds correct profile shape', () => {
        const profile = buildProfileFromQueued(mockQueued);
        expect(profile.speciesName).toBe('pikachu');
        expect(profile.types).toEqual(['electric']);
        expect(profile.spriteUrl).toContain('/25.png');
        expect(profile.pokemon.name).toBe('Ash');
    });
});

describe('getLikedProfiles', () => {
    it('returns profiles for liked pokemon', async () => {
        const profiles = await getLikedProfiles(1);
        expect(profiles).toHaveLength(1);
        expect(profiles[0].speciesName).toBe('pikachu');
    });

    it('filters out pokemon with null species data', async () => {
        mockBuildClean.mockResolvedValue(null);
        const profiles = await getLikedProfiles(1);
        expect(profiles).toHaveLength(0);
    });
});
