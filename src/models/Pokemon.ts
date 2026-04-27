import db from "../database";
import { Pokemon, DraftPokemon } from "../types/pokemon.types";
import { PokemonRow } from "../types/database.types";

function mapPokemon(row: PokemonRow): Pokemon {
    return {
        id: row.id,
        speciesId: row.species_id,
        name: row.name,
        locationId: row.location_id ?? 0,
        gender: row.gender ?? 0,
        description: row.description,
        level: row.level,
        size: {
            weight: row.weight,
            height: row.height,
        },
        statsIV: {
            hp: row.iv_hp,
            atk: row.iv_atk,
            def: row.iv_def,
            spAtk: row.iv_sp_atk,
            spDef: row.iv_sp_def,
            speed: row.iv_speed,
        },
        natureId: row.nature_id,
        isShiny: Boolean(row.is_shiny),
    };
}

const insertStmt = db.prepare(`
    INSERT INTO POKEMON (
        species_id, name, description, location_id, gender,
        weight, height, level, nature_id,
        iv_hp, iv_atk, iv_def, iv_sp_atk, iv_sp_def, iv_speed, is_shiny
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectByIdStmt = db.prepare("SELECT * FROM POKEMON WHERE id = ?");

const selectLikedStmt = db.prepare(`
    SELECT p.* FROM POKEMON p
    INNER JOIN SWIPES s ON s.pokemon_id = p.id
    WHERE s.user_id = ? AND s.is_liked = 1
    ORDER BY s.created_at DESC
`);

export function insertPokemon(draftPokemon: DraftPokemon): Pokemon {
    const info = insertStmt.run(
        draftPokemon.speciesId,
        draftPokemon.name,
        draftPokemon.description,
        draftPokemon.locationId,
        draftPokemon.gender,
        draftPokemon.size.weight,
        draftPokemon.size.height,
        draftPokemon.level,
        draftPokemon.natureId,
        draftPokemon.statsIV.hp,
        draftPokemon.statsIV.atk,
        draftPokemon.statsIV.def,
        draftPokemon.statsIV.spAtk,
        draftPokemon.statsIV.spDef,
        draftPokemon.statsIV.speed,
        draftPokemon.isShiny ? 1 : 0,
    );
    return { ...draftPokemon, id: info.lastInsertRowid as number };
}

export function getPokemonById(id: number): Pokemon | undefined {
    const row = selectByIdStmt.get(id) as PokemonRow | undefined;
    return row ? mapPokemon(row) : undefined;
}

export function getLikedPokemon(userId: number): Pokemon[] {
    const rows = selectLikedStmt.all(userId) as PokemonRow[];
    return rows.map(mapPokemon);
}
