import request from 'supertest';
import { app } from '../../src/app';

describe('General Server Tests', () => {

    it('should return 200 OK for the home (login) page', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.text).toContain('DexMatch');
        expect(response.text).toContain('Login');
    });

    it('should return 404 for a route that does not exist', async () => {
        const response = await request(app).get('/this-is-not-a-real-page');
        expect(response.status).toBe(404);
    });
});
