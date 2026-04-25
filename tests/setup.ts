process.env.DB_PATH = ":memory:";

import { initDB } from "../src/database";

// Initialize database schema before any tests or models are loaded
initDB();
