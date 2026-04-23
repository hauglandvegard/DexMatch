import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.join(import.meta.dirname, 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

db.pragma('foreign_keys = ON');

const initDB = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS USERS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT,
            password_hash TEXT NOT NULL,
            region_id_pref INTEGER,
            theme INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS USER_TYPE_PREFS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type INTEGER NOT NULL,
            is_wanted BOOLEAN NOT NULL CHECK (is_wanted IN (0, 1)),
            FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS POKEMONS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            species_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            primary_type_id INTEGER,
            secondary_type_id INTEGER,
            area_id INTEGER,
            gender STRING,
            weight INTEGER,
            height INTEGER,
            level INTEGER,
            nature_id INTEGER,
            iv_hp INTEGER,
            iv_atk INTEGER,
            iv_def INTEGER,
            iv_sp_atk INTEGER,
            iv_sp_def INTEGER,
            iv_speed INTEGER,
            is_shiny BOOLEAN
        );

        CREATE TABLE IF NOT EXISTS SWIPES (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            pokemon_id INTEGER NOT NULL,
            is_liked BOOLEAN NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
            FOREIGN KEY (pokemon_id) REFERENCES POKEMONS(id) ON DELETE CASCADE,
            UNIQUE(user_id, pokemon_id)
        );
    `);
    console.log("Database initialized successfully!");
};

initDB();

export default db;
