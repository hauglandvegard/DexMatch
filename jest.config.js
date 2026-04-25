/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFiles: ["<rootDir>/tests/setup.ts"],
    testMatch: ["**/tests/**/*.test.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^pokedex-promise-v2$": "<rootDir>/__mocks__/pokedex-promise-v2.ts",
        "^@faker-js/faker$": "<rootDir>/__mocks__/@faker-js/faker.ts",
    },
};
