import { Router } from 'express';
import db from '../database';

const router = Router();

router.get('/health', (req, res) => {
    let dbOk = false;
    try {
        db.prepare('SELECT 1').get();
        dbOk = true;
    } catch {
        dbOk = false;
    }

    const status = dbOk ? 'ok' : 'degraded';
    const code = dbOk ? 200 : 503;

    res.status(code).json({
        status,
        version: process.env.npm_package_version ?? 'unknown',
        uptime: Math.floor(process.uptime()),
        db: dbOk ? 'ok' : 'error',
    });
});

export default router;
