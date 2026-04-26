import Pokedex from 'pokedex-promise-v2';
import { buildCleanSpeciesData, fetchRegionSpeciesIds } from '../../src/services/pokeApi.service';

// pokeApi.service creates `const P = new Pokedex(...)` at module load.
// Get that instance from the mock constructor's call record.
const getMockInstance = () => (Pokedex as jest.Mock).mock.results[0].value;

const mockPokemonData = {
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    stats: [
        { base_stat: 45, stat: { name: 'hp' } },
        { base_stat: 49, stat: { name: 'attack' } },
        { base_stat: 49, stat: { name: 'defense' } },
        { base_stat: 65, stat: { name: 'special-attack' } },
        { base_stat: 65, stat: { name: 'special-defense' } },
        { base_stat: 45, stat: { name: 'speed' } },
    ],
    types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
};

const mockSpeciesData = {
    id: 1,
    is_legendary: false,
    evolves_from_species: null,
};

describe('buildCleanSpeciesData', () => {
    let mockInstance: ReturnType<typeof getMockInstance>;

    beforeEach(() => {
        mockInstance = getMockInstance();
        mockInstance.getPokemonByName.mockReset();
        mockInstance.getPokemonSpeciesByName.mockReset();
        mockInstance.getPokemonByName.mockResolvedValue(mockPokemonData);
        mockInstance.getPokemonSpeciesByName.mockResolvedValue(mockSpeciesData);
    });

    it('returns null if pokemon fetch throws', async () => {
        mockInstance.getPokemonByName.mockRejectedValue(new Error('network error'));
        expect(await buildCleanSpeciesData(1)).toBeNull();
    });

    it('returns null if species fetch throws', async () => {
        mockInstance.getPokemonSpeciesByName.mockRejectedValue(new Error('network error'));
        expect(await buildCleanSpeciesData(1)).toBeNull();
    });

    it('maps all six base stats correctly', async () => {
        const result = await buildCleanSpeciesData(1);
        expect(result!.baseStats).toEqual({
            hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, speed: 45,
        });
    });

    it('maps types array', async () => {
        const result = await buildCleanSpeciesData(1);
        expect(result!.types).toEqual(['grass', 'poison']);
    });

    it('sets isLegendary from species data', async () => {
        mockInstance.getPokemonSpeciesByName.mockResolvedValue({ ...mockSpeciesData, is_legendary: true });
        const result = await buildCleanSpeciesData(1);
        expect(result!.isLegendary).toBe(true);
    });

    it('sets minEvolvedLevel to 20 when evolves_from_species is set', async () => {
        mockInstance.getPokemonSpeciesByName.mockResolvedValue({
            ...mockSpeciesData,
            evolves_from_species: { name: 'eevee', url: '...' },
        });
        const result = await buildCleanSpeciesData(1);
        expect(result!.minEvolvedLevel).toBe(20);
    });

    it('sets minEvolvedLevel to 1 when not evolved', async () => {
        const result = await buildCleanSpeciesData(1);
        expect(result!.minEvolvedLevel).toBe(1);
    });

    it('sets base size from pokemon data', async () => {
        const result = await buildCleanSpeciesData(1);
        expect(result!.baseSize).toEqual({ height: 7, weight: 69 });
    });

    it('uses species id from species data', async () => {
        const result = await buildCleanSpeciesData(1);
        expect(result!.id).toBe(mockSpeciesData.id);
    });

    it('uses pokemon name from pokemon data', async () => {
        const result = await buildCleanSpeciesData(1);
        expect(result!.name).toBe('bulbasaur');
    });

    it('ignores unknown stat names', async () => {
        mockInstance.getPokemonByName.mockResolvedValue({
            ...mockPokemonData,
            stats: [
                ...mockPokemonData.stats,
                { base_stat: 99, stat: { name: 'unknown-stat' } },
            ],
        });
        const result = await buildCleanSpeciesData(1);
        expect(result).not.toBeNull();
        expect(Object.keys(result!.baseStats)).toHaveLength(6);
    });
});

describe('fetchRegionSpeciesIds', () => {
    let mockInstance: ReturnType<typeof getMockInstance>;

    const pokedex1 = {
        pokemon_entries: [
            { pokemon_species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } },
            { pokemon_species: { url: 'https://pokeapi.co/api/v2/pokemon-species/2/' } },
        ],
    };
    const pokedex2 = {
        pokemon_entries: [
            { pokemon_species: { url: 'https://pokeapi.co/api/v2/pokemon-species/2/' } },
            { pokemon_species: { url: 'https://pokeapi.co/api/v2/pokemon-species/3/' } },
        ],
    };
    const mockRegion = {
        pokedexes: [
            { url: 'https://pokeapi.co/api/v2/pokedex/1/' },
            { url: 'https://pokeapi.co/api/v2/pokedex/2/' },
        ],
    };

    beforeEach(() => {
        mockInstance = getMockInstance();
        mockInstance.getRegionByName.mockReset();
        mockInstance.getResource.mockReset();
    });

    it('merges species IDs from all pokedexes', async () => {
        mockInstance.getRegionByName.mockResolvedValue(mockRegion);
        mockInstance.getResource
            .mockResolvedValueOnce(pokedex1)
            .mockResolvedValueOnce(pokedex2);

        const ids = await fetchRegionSpeciesIds(1);
        expect(ids).toEqual(new Set([1, 2, 3]));
    });

    it('deduplicates species across pokedexes', async () => {
        mockInstance.getRegionByName.mockResolvedValue(mockRegion);
        mockInstance.getResource
            .mockResolvedValueOnce(pokedex1)
            .mockResolvedValueOnce(pokedex2);

        const ids = await fetchRegionSpeciesIds(1);
        expect(ids.size).toBe(3);
    });

    it('returns empty set when region fetch fails', async () => {
        mockInstance.getRegionByName.mockRejectedValue(new Error('network error'));
        const ids = await fetchRegionSpeciesIds(1);
        expect(ids.size).toBe(0);
    });

    it('returns empty set when region has no pokedexes', async () => {
        mockInstance.getRegionByName.mockResolvedValue({ pokedexes: [] });
        const ids = await fetchRegionSpeciesIds(1);
        expect(ids.size).toBe(0);
    });

    it('skips pokedex entries that fail to fetch', async () => {
        mockInstance.getRegionByName.mockResolvedValue(mockRegion);
        mockInstance.getResource
            .mockRejectedValueOnce(new Error('fail'))
            .mockResolvedValueOnce(pokedex2);

        const ids = await fetchRegionSpeciesIds(1);
        expect(ids).toEqual(new Set([2, 3]));
    });
});
