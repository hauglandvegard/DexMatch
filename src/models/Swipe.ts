import db from "../database";
import { SwipeRow } from "../types/database.types";
import { Swipe } from "../types/swipe.type";

/**
 * Maps database row to Swipe interface.
 */
function mapSwipe(row: SwipeRow): Swipe {
    return {
        id: row.id,
        userId: row.user_id,
        pokemonId: row.pokemon_id,
        isLiked: Boolean(row.is_liked),
        createdAt: row.created_at,
    };
}

const insertSwipeStmt = db.prepare(
    "INSERT OR IGNORE INTO SWIPES (user_id, pokemon_id, is_liked) VALUES (?, ?, ?)",
);

const selectByUserIdStmt = db.prepare("SELECT * FROM SWIPES WHERE user_id = ?");

/**
 * Insert Swipe → DB.
 * @param userId - User ID.
 * @param pokemonId - Pokemon ID.
 * @param isLiked - True if liked.
 * @returns Inserted ID.
 */
export function createSwipe(
    userId: number,
    pokemonId: number,
    isLiked: boolean,
): number {
    const info = insertSwipeStmt.run(userId, pokemonId, isLiked ? 1 : 0);
    return info.lastInsertRowid as number;
}

/**
 * Get Swipes by user ID.
 * @param userId - User ID.
 * @returns Swipes array.
 */
export function getSwipesByUserId(userId: number): Swipe[] {
    const rows = selectByUserIdStmt.all(userId) as SwipeRow[];
    return rows.map(mapSwipe);
}
