export interface User {
    id: number;
    username: string;
    displayName: string | null;
    passwordHash: string;
    regionIdPref: number | null;
    themeId: number;
}
