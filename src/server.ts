import { initDB } from "./database";

initDB();

import { app } from "./app";
import { seedPool } from "./services/pokeService";
import logger from "./utils/logger";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`DexMatch is live at http://localhost:${PORT}`);
    logger.debug(`Development proxy at http://localhost:3001`);
    logger.info(`Press Ctrl+C to stop`);
});

seedPool().catch((err) => logger.error('Failed to seed pokemon pool on startup', err));
