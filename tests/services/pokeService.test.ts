import { getAllRegionalPokemonIds } from '../../src/services/pokeService'; // Adjust path
import logger from '../../src/utils/logger';

// 1. Setup Mock Functions for Pokedex
const mockGetRegionByName = jest.fn();
const mockGetResource = jest.fn();

// 2. Mock the entire pokedex-promise-v2 module
jest.mock('pokedex-promise-v2', () => {
    return jest.fn().mockImplementation(() => ({
        // FIX: Wrap these in an arrow function to defer evaluation!
        getRegionByName: (...args: any[]) => mockGetRegionByName(...args),
        getResource: (...args: any[]) => mockGetResource(...args),
    }));
});

// 2. ADD THIS: Mock the logger module
jest.mock('../../src/utils/logger', () => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
}));

describe('getAllRegionalPokemonIds', () => {

    // Clear mock histories between tests
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch, extract, deduplicate, and sort Pokémon IDs across multiple pokedexes', async () => {
        // Arrange: Mock the Region response (returns 2 pokedex URLs)
        mockGetRegionByName.mockResolvedValueOnce({
            pokedexes: [{ url: 'url1' }, { url: 'url2' }]
        });

        mockGetResource.mockResolvedValueOnce([
            { pokemon_entries: [{ pokemon_species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } }] },
            { pokemon_entries: [
                { pokemon_species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } }, // Duplicate
                { pokemon_species: { url: 'https://pokeapi.co/api/v2/pokemon-species/4/' } },
                { pokemon_species: { url: 'https://pokeapi.co/api/v2/pokemon-species/2/' } }
            ] }
        ]);

        const result = await getAllRegionalPokemonIds(1);

        // Assert
        expect(mockGetRegionByName).toHaveBeenCalledWith(1);
        expect(mockGetResource).toHaveBeenCalledWith(['url1', 'url2']);
        // Verify duplicates were removed and array is sorted (1, 2, 4)
        expect(result).toEqual([1, 2, 4]);
        expect(logger.debug).toHaveBeenCalled();
    });

    it('should return an empty array if the region has no pokedexes', async () => {
        // Arrange
        mockGetRegionByName.mockResolvedValueOnce({ pokedexes: [] });

        // Act
        const result = await getAllRegionalPokemonIds(0);

        // Assert
        expect(result).toEqual([]);
        expect(mockGetResource).not.toHaveBeenCalled(); // Shouldn't fetch resources if none exist
    });

    it('should log an error and return an empty array if the API fails', async () => {
        // Arrange: Force the API to crash
        const mockError = new Error('API is down');
        mockGetRegionByName.mockRejectedValueOnce(mockError);

        // Act
        const result = await getAllRegionalPokemonIds(1);

        // Assert
        expect(result).toEqual([]);
        expect(logger.error).toHaveBeenCalledWith('Error fetching data for region with id 1:', mockError);
    });
});
