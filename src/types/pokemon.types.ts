export interface PokeStats {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
}
export interface PokeAttributes {
    height: number;
    weight: number;
    nature_id: number;
    isLegendary: boolean;
}

export interface CleanSpeciesData {
    id: number;
    name: string;
    attributs: PokeAttributes;
    stats: PokeStats;
    isLegendary: boolean;
    minEvolvedLevel: number;
    chanseForMale: number;
    LocationIds: number[];
}

export interface Pokemon {
    id: number;
    name: string;
    speciesId: number;
    description: string;
    level: number;
    attributes: PokeAttributes;
    statsIV: PokeStats;
    isShiny: boolean;
}

export enum Gender {
    GENDERLESS = 0,
    MALE = 1,
    FEMALE = 2,
}
