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
            type TEXT NOT NULL,
            is_wanted BOOLEAN NOT NULL CHECK (is_wanted IN (0, 1)),
            FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS POKEMONS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pokemon_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            area_id TEXT,
            gender STRING,
            weight INTEGER,
            height INTEGER,
            level INTEGER,
            nature_id INTEGER,
            hp INTEGER,
            atk INTEGER,
            def INTEGER,
            sp_atk INTEGER,
            sp_def INTEGER,
            speed INTEGER,
            is_shiny BOOLEAN
        );

        CREATE TABLE IF NOT EXISTS SWIPES (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            pokemon_id INTEGER NOT NULL,
            is_liked BOOLEAN NOT NULL CHECK (is_liked IN (0, 1)),
            FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
            FOREIGN KEY (pokemon_id) REFERENCES POKEMONS(id) ON DELETE CASCADE,
            UNIQUE(user_id, pokemon_id)
        );
    `);
    console.log("Database initialized successfully!");
};

initDB();

export default db;
