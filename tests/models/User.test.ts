import {
    createUser,
    getUserByUsername,
    getUserById,
    updateUserRegionPreference,
    updateUserThemePreference,
    setUserTypePreference,
    getWantedTypeIds,
} from "../../src/models/User";
import db from "../../src/database";

describe("User Model Tests", () => {
    let testUserId: number;
    let testUsername: string;

    beforeAll(() => {
        testUsername = `testuser_${Date.now()}`;
    });

    afterAll(() => {
        if (testUserId) {
            db.prepare("DELETE FROM USERS WHERE id = ?").run(testUserId);
        }
    });

    describe("createUser", () => {
        it("should create a new user and return their id", () => {
            testUserId = createUser(testUsername, "hashed_password");
            expect(testUserId).toBeGreaterThan(0);
        });
    });

    describe("getUserByUsername", () => {
        it("should retrieve a user by their username", () => {
            const user = getUserByUsername(testUsername);
            expect(user).toBeDefined();
            expect(user?.id).toBe(testUserId);
            expect(user?.username).toBe(testUsername);
            expect(user?.passwordHash).toBe("hashed_password");
            expect(user?.regionIdPref).toBeNull();
            expect(user?.themeId).toBe(0);
        });

        it("should return undefined for a non-existent username", () => {
            const user = getUserByUsername("non_existent_user_12345");
            expect(user).toBeUndefined();
        });
    });

    describe("getUserById", () => {
        it("should retrieve a user by their id", () => {
            const user = getUserById(testUserId);
            expect(user).toBeDefined();
            expect(user?.id).toBe(testUserId);
            expect(user?.username).toBe(testUsername);
        });

        it("should return undefined for a non-existent id", () => {
            const user = getUserById(-1);
            expect(user).toBeUndefined();
        });
    });

    describe("updateUserRegionPreference", () => {
        it("should update the region preference for a user", () => {
            updateUserRegionPreference(testUserId, 5);
            const user = getUserById(testUserId);
            expect(user?.regionIdPref).toBe(5);
        });
    });

    describe("setUserTypePreference", () => {
        it("should insert a new type preference if one does not exist", () => {
            setUserTypePreference(testUserId, 1, true);

            const stmt = db.prepare(
                "SELECT is_wanted FROM USER_TYPE_PREFS WHERE user_id = ? AND type_id = ?",
            );
            const row = stmt.get(testUserId, 1) as any;

            expect(row).toBeDefined();
            expect(row.is_wanted).toBe(1);
        });

        it("should update an existing type preference", () => {
            setUserTypePreference(testUserId, 1, false);

            const stmt = db.prepare(
                "SELECT is_wanted FROM USER_TYPE_PREFS WHERE user_id = ? AND type_id = ?",
            );
            const row = stmt.get(testUserId, 1) as any;

            expect(row).toBeDefined();
            expect(row.is_wanted).toBe(0);
        });
    });

    describe("getWantedTypeIds", () => {
        it("should return only type IDs marked as wanted", () => {
            setUserTypePreference(testUserId, 10, true);
            setUserTypePreference(testUserId, 11, true);
            setUserTypePreference(testUserId, 12, false);

            const wanted = getWantedTypeIds(testUserId);
            expect(wanted).toContain(10);
            expect(wanted).toContain(11);
            expect(wanted).not.toContain(12);
        });

        it("should return empty array for user with no wanted types", () => {
            const wanted = getWantedTypeIds(-1);
            expect(wanted).toEqual([]);
        });
    });

    describe("updateUserThemePreference", () => {
        it("should update the theme preference for a user", () => {
            updateUserThemePreference(testUserId, 2);
            const user = getUserById(testUserId);
            expect(user?.themeId).toBe(2);
        });

        it("should throw an error for a non-existent user", () => {
            expect(() => updateUserThemePreference(-1, 1)).toThrow(
                "User with ID -1 not found.",
            );
        });
    });
});
