export interface PokeStats {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
}
export interface PokeSize {
    height: number;
    weight: number;
}

export enum Gender {
    GENDERLESS = 0,
    MALE = 1,
    FEMALE = 2,
}

export interface DraftPokemon {
    name: string;
    speciesId: number;
    description: string;
    gender: Gender;
    level: number;
    size: PokeSize;
    statsIV: PokeStats;
    isShiny: boolean;
    natureId: number;
    locationId: number;
}

export interface Pokemon extends DraftPokemon {
    id: number;
}

export interface CleanSpeciesData {
    id: number;
    name: string;
    baseStats: PokeStats;
    baseSize: PokeSize;
    types: string[];
    isLegendary: boolean;
    minEvolvedLevel: number;
    chanceForMale: number;
    locationIds: number[];
}
