module.exports = {
    apps: [
        {
            name: "dexmatch",
            script: "./dist/server.js",
            env_production: {
                NODE_ENV: "production",
            },
        },
    ],
};
