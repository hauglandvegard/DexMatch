import db from "../database";
import { UserRow } from "../types/database.types";
import { User } from "../types/user.types";
import { ConflictError, NotFoundError } from "../errors";

/**
 * Maps database row to User interface.
 */
function mapUser(row: UserRow): User {
    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        passwordHash: row.password_hash,
        regionIdPref: row.region_id_pref,
        themeId: row.theme_id,
    };
}

const insertUserStmt = db.prepare(
    "INSERT INTO USERS (username, password_hash, display_name) VALUES (?, ?, ?)",
);

const selectByUsernameStmt = db.prepare(
    "SELECT * FROM USERS WHERE username = ?",
);

const selectByIdStmt = db.prepare("SELECT * FROM USERS WHERE id = ?");

const updateRegionStmt = db.prepare(
    "UPDATE USERS SET region_id_pref = ? WHERE id = ?",
);

const updateThemeStmt = db.prepare(
    "UPDATE USERS SET theme_id = ? WHERE id = ?",
);

const upsertTypePrefStmt = db.prepare(`
    INSERT INTO USER_TYPE_PREFS (user_id, type_id, is_wanted)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, type_id) DO UPDATE SET
        is_wanted = excluded.is_wanted
`);

/**
 * Creates new user in DB.
 * @param username - Chosen username.
 * @param passwordHash - Hashed password.
 * @returns ID of newly created user.
 * @throws Error if username already exists or other DB constraints fail.
 */
export function createUser(username: string, passwordHash: string, displayName?: string): number {
    try {
        const info = insertUserStmt.run(username, passwordHash, displayName ?? null);
        return info.lastInsertRowid as number;
    } catch (error: any) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            throw new ConflictError(`Username "${username}" is already taken.`);
        }
        throw error;
    }
}

/**
 * Retrieves user by username.
 * @param username - Username to search for.
 * @returns User object if found, undefined otherwise.
 */
export function getUserByUsername(username: string): User | undefined {
    const row = selectByUsernameStmt.get(username) as UserRow | undefined;
    return row ? mapUser(row) : undefined;
}

/**
 * Retrieves user by ID.
 * @param id - User ID to search for.
 * @returns User object if found, undefined otherwise.
 */
export function getUserById(id: number): User | undefined {
    const row = selectByIdStmt.get(id) as UserRow | undefined;
    return row ? mapUser(row) : undefined;
}

/**
 * Updates user's region preference.
 * @param userId - ID of user.
 * @param regionId - ID of region.
 */
export function updateUserRegionPreference(
    userId: number,
    regionId: number,
): void {
    const result = updateRegionStmt.run(regionId, userId);
    if (result.changes === 0) {
        throw new NotFoundError(`User with ID ${userId} not found.`);
    }
}

/**
 * Updates user's theme preference.
 * @param userId - ID of user.
 * @param themeId - ID of theme.
 */
export function updateUserThemePreference(
    userId: number,
    themeId: number,
): void {
    const result = updateThemeStmt.run(themeId, userId);
    if (result.changes === 0) {
        throw new NotFoundError(`User with ID ${userId} not found.`);
    }
}

/**
 * Updates user's type preferences using an atomic upsert.
 * @param userId - ID of user.
 * @param typeId - ID of type.
 * @param isWanted - Whether user wants to see type or not.
 */
export function setUserTypePreference(
    userId: number,
    typeId: number,
    isWanted: boolean,
): void {
    const isWantedInt = isWanted ? 1 : 0;
    upsertTypePrefStmt.run(userId, typeId, isWantedInt);
}
