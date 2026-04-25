import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { createUser, getUserByUsername } from '../models/User';

const router = Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('login', { error: 'Username and password required.' });
    }

    const user = getUserByUsername(String(username));
    if (!user) {
        return res.render('login', { error: 'Invalid username or password.' });
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
        return res.render('login', { error: 'Invalid username or password.' });
    }

    req.session.userId = user.id;
    res.redirect('/swipe');
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('login', { error: 'Username and password required.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    try {
        const userId = createUser(String(username), passwordHash);
        req.session.userId = userId;
        res.redirect('/swipe');
    } catch (error: any) {
        res.render('login', { error: error.message });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

export default router;
