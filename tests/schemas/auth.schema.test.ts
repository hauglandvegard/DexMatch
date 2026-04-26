import { loginSchema, registerSchema } from '../../src/schemas/auth.schema';

describe('Auth Schemas', () => {
    describe('loginSchema', () => {
        it('accepts valid credentials', () => {
            const result = loginSchema.safeParse({ username: 'ash', password: 'secret' });
            expect(result.success).toBe(true);
        });

        it('rejects empty username', () => {
            const result = loginSchema.safeParse({ username: '', password: 'secret' });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe('Username required.');
        });

        it('rejects empty password', () => {
            const result = loginSchema.safeParse({ username: 'ash', password: '' });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe('Password required.');
        });

        it('rejects missing fields', () => {
            const result = loginSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });

    describe('registerSchema', () => {
        it('accepts valid username and password', () => {
            const result = registerSchema.safeParse({ username: 'ash_123', password: 'pikachu1' });
            expect(result.success).toBe(true);
        });

        it('rejects username shorter than 3 chars', () => {
            const result = registerSchema.safeParse({ username: 'ab', password: 'pikachu1' });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe('Username must be at least 3 characters.');
        });

        it('rejects username longer than 20 chars', () => {
            const result = registerSchema.safeParse({ username: 'a'.repeat(21), password: 'pikachu1' });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe('Username must be at most 20 characters.');
        });

        it('rejects username with invalid characters', () => {
            const result = registerSchema.safeParse({ username: 'ash!', password: 'pikachu1' });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe(
                'Username may only contain letters, numbers, and underscores.',
            );
        });

        it('rejects username with spaces', () => {
            const result = registerSchema.safeParse({ username: 'ash ketchum', password: 'pikachu1' });
            expect(result.success).toBe(false);
        });

        it('rejects password shorter than 8 chars', () => {
            const result = registerSchema.safeParse({ username: 'ash_123', password: 'short' });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe('Password must be at least 8 characters.');
        });

        it('accepts username at boundary lengths (3 and 20 chars)', () => {
            expect(registerSchema.safeParse({ username: 'ash', password: 'pikachu1' }).success).toBe(true);
            expect(registerSchema.safeParse({ username: 'a'.repeat(20), password: 'pikachu1' }).success).toBe(true);
        });

        it('accepts password exactly 8 chars', () => {
            const result = registerSchema.safeParse({ username: 'ash_123', password: '12345678' });
            expect(result.success).toBe(true);
        });
    });
});
