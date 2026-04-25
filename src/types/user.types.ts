export interface DraftUser {
    username: string;
    displayName: string | null;
    passwordHash: string;
    regionIdPref: number | null;
    themeId: number;
}

export interface User extends DraftUser {
    id: number;
}
