import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

import logger from "./utils/logger";

const dbPath =
    process.env.DB_PATH ||
    path.join(__dirname, "..", "data", "database.sqlite");

if (dbPath !== ":memory:") {
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

export const initDB = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS USERS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT,
            password_hash TEXT NOT NULL,
            region_id_pref INTEGER,
            theme_id INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS USER_TYPE_PREFS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type_id INTEGER NOT NULL,
            is_wanted BOOLEAN NOT NULL CHECK (is_wanted IN (0, 1)),
            FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
            UNIQUE(user_id, type_id)
        );

        CREATE TABLE IF NOT EXISTS POKEMON (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            species_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            location_id INTEGER,
            gender INTEGER,
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
            FOREIGN KEY (pokemon_id) REFERENCES POKEMON(id) ON DELETE CASCADE,
            UNIQUE(user_id, pokemon_id)
        );
    `);
    logger.info("Database initialized successfully!");
};

// Run at import time so tables exist before any model calls db.prepare()
initDB();

// Graceful shutdown
process.on("exit", () => db.close());
process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

export default db;
