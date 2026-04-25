import { app } from "./app";
import logger from "./utils/logger";
import { initDB } from "./database";

const PORT = process.env.PORT || 3000;

// Init DB before listening
initDB();

app.listen(PORT, () => {
    logger.info(`DexMatch is live at http://localhost:${PORT}`);
    logger.debug(`Development proxy at http://localhost:3001`);
    logger.info(`Press Ctrl+C to stop`);
});
