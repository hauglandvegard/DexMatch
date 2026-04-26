const Pokedex = jest.fn().mockImplementation(() => ({
    getPokemonByName: jest.fn().mockResolvedValue(null),
    getPokemonSpeciesByName: jest.fn().mockResolvedValue(null),
    getResource: jest.fn().mockResolvedValue(null),
    getRegionsList: jest.fn().mockResolvedValue(null),
}));

export default Pokedex;
