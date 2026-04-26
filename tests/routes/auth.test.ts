import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../src/app';
import { createUser } from '../../src/models/User';
import db from '../../src/database';

const TEST_USERNAME = `tst_${Date.now() % 100000}`;
const TEST_PASSWORD = 'pikachu123';
let TEST_USER_ID: number;

beforeAll(() => {
    const hash = bcrypt.hashSync(TEST_PASSWORD, 1);
    TEST_USER_ID = createUser(TEST_USERNAME, hash);
});

afterAll(() => {
    if (TEST_USER_ID) {
        db.prepare('DELETE FROM USERS WHERE id = ?').run(TEST_USER_ID);
    }
});

describe('POST /login', () => {
    it('redirects to /swipe on valid credentials', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: TEST_USERNAME, password: TEST_PASSWORD });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/swipe');
    });

    it('returns 200 with error on wrong password', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: TEST_USERNAME, password: 'wrongpassword' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('Invalid username or password.');
    });

    it('returns 200 with error for non-existent user', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: 'nobody_12345', password: 'somepassword' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('Invalid username or password.');
    });

    it('returns 200 with validation error on empty username', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: '', password: 'somepassword' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('Username required.');
    });

    it('returns 200 with validation error on empty password', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: TEST_USERNAME, password: '' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('Password required.');
    });
});

describe('POST /register', () => {
    const NEW_USERNAME = `reg_${Date.now() % 100000}`;
    let newUserId: number | undefined;

    afterAll(() => {
        if (newUserId) {
            db.prepare('DELETE FROM USERS WHERE id = ?').run(newUserId);
        }
    });

    it('redirects to /swipe and creates user on valid input', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: NEW_USERNAME, password: 'validpass1' });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/swipe');

        const { createUser: _c, getUserByUsername } = await import('../../src/models/User');
        const user = getUserByUsername(NEW_USERNAME);
        expect(user).toBeDefined();
        newUserId = user?.id;
    });

    it('returns 200 with error on duplicate username', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: TEST_USERNAME, password: 'validpass1' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('already taken');
    });

    it('returns 200 with error on username too short', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: 'ab', password: 'validpass1' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('at least 3 characters');
    });

    it('returns 200 with error on username too long', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: 'a'.repeat(21), password: 'validpass1' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('at most 20 characters');
    });

    it('returns 200 with error on invalid username characters', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: 'bad!name', password: 'validpass1' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('letters, numbers, and underscores');
    });

    it('returns 200 with error on password too short', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: 'validname', password: 'short' });

        expect(res.status).toBe(200);
        expect(res.text).toContain('at least 8 characters');
    });
});

describe('POST /logout', () => {
    it('destroys session and redirects to /', async () => {
        const agent = request.agent(app);

        await agent
            .post('/login')
            .send({ username: TEST_USERNAME, password: TEST_PASSWORD });

        const res = await agent.post('/logout');

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/');
    });
});
