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

export interface Pokemon {
    id: number;
    name: string;
    speciesId: number;
    description: string;
    level: number;
    size: PokeSize;
    statsIV: PokeStats;
    isShiny: boolean;
    nature_id: number;
}

export interface CleanSpeciesData {
    id: number;
    name: string;
    size: PokeSize;
    stats: PokeStats;
    types: string[];
    isLegendary: boolean;
    minEvolvedLevel: number;
    chanseForMale: number;
    LocationIds: number[];
}

export enum Gender {
    GENDERLESS = 0,
    MALE = 1,
    FEMALE = 2,
}
