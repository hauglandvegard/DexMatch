import db from "../database";
import { Pokemon, DraftPokemon } from "../types/pokemon.types";
import { PokemonRow } from "../types/database.types";

/**
 * Maps DB row to Pokemon interface.
 */
function mapPokemon(row: PokemonRow): Pokemon {
    return {
        id: row.id,
        speciesId: row.species_id,
        name: row.name,
        locationId: row.location_id ?? 0,
        gender: row.gender ?? 0,
        description: "",
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

// Prepared statements for production performance
const insertStmt = db.prepare(`
    INSERT INTO POKEMON (
        species_id, name, location_id, gender,
        weight, height, level, nature_id,
        iv_hp, iv_atk, iv_def, iv_sp_atk, iv_sp_def, iv_speed, is_shiny
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectByIdStmt = db.prepare("SELECT * FROM POKEMON WHERE id = ?");

/**
 * Insert Pokemon → DB.
 * @param draftPokemon - The draft pokemon data.
 * @returns The inserted pokemon with its ID.
 */
export function insertPokemon(draftPokemon: DraftPokemon): Pokemon {
    const info = insertStmt.run(
        draftPokemon.speciesId,
        draftPokemon.name,
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

    return {
        ...draftPokemon,
        id: info.lastInsertRowid as number,
    };
}

/**
 * Get Pokemon by ID.
 * @param id - Pokemon ID.
 * @returns Pokemon object if found.
 */
export function getPokemonById(id: number): Pokemon | undefined {
    const row = selectByIdStmt.get(id) as PokemonRow | undefined;
    return row ? mapPokemon(row) : undefined;
}
