declare module 'better-sqlite3-session-store' {
    import session = require('express-session');
    import Database = require('better-sqlite3');

    interface SqliteStoreOptions {
        client: Database.Database;
        expired?: {
            clear: boolean;
            intervalMs: number;
        };
    }

    class SqliteStore extends session.Store {
        constructor(options: SqliteStoreOptions);
    }

    type Factory = (deps: { Store: typeof session.Store }) => typeof SqliteStore;
    const factory: Factory;
    export = factory;
}
