export interface UserRow {
    id: number;
    username: string;
    display_name: string | null;
    password_hash: string;
    region_id_pref: number | null;
    theme_id: number;
}

export interface PokemonRow {
    id: number;
    species_id: number;
    name: string;
    location_id: number | null;
    gender: number | null;
    weight: number;
    height: number;
    level: number;
    nature_id: number;
    iv_hp: number;
    iv_atk: number;
    iv_def: number;
    iv_sp_atk: number;
    iv_sp_def: number;
    iv_speed: number;
    is_shiny: number;
}
