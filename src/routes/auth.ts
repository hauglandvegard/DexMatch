import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

import { createUser, getUserByUsername } from '../models/User';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { ConflictError } from '../errors';
import logger from '../utils/logger';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many attempts. Try again in 15 minutes.',
});

router.post('/login', authLimiter, async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        res.locals.error = result.error.issues[0].message;
        res.locals.activeTab = 'login';
        return res.render('login');
    }

    const { username, password } = result.data;

    const user = getUserByUsername(username);
    if (!user) {
        res.locals.error = 'Invalid username or password.';
        res.locals.activeTab = 'login';
        return res.render('login');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        logger.warn('Failed login attempt', { username });
        res.locals.error = 'Invalid username or password.';
        res.locals.activeTab = 'login';
        return res.render('login');
    }

    req.session.userId = user.id;
    res.redirect('/swipe');
});

router.post('/register', authLimiter, async (req, res) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
        res.locals.error = result.error.issues[0].message;
        res.locals.activeTab = 'register';
        return res.render('login');
    }

    const { username, password, displayName } = result.data;
    const passwordHash = await bcrypt.hash(password, 12);

    try {
        const userId = createUser(username, passwordHash, displayName);
        req.session.userId = userId;
        logger.info('New user registered', { username, userId });
        res.redirect('/swipe');
    } catch (error) {
        if (error instanceof ConflictError) {
            res.locals.error = error.message;
            res.locals.activeTab = 'register';
            return res.render('login');
        }
        throw error;
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

export default router;
