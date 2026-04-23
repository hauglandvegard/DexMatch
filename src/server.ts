import { app } from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`DexMatch is live at http://localhost:${PORT}`);
    logger.debug(`Development proxy at http://localhost:3001`);
    logger.info(`Press Ctrl+C to stop`);
});
