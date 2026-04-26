import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, 'Username required.'),
    password: z.string().min(1, 'Password required.'),
});

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters.')
        .max(20, 'Username must be at most 20 characters.')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters.'),
    displayName: z
        .string()
        .max(30, 'Display name must be at most 30 characters.')
        .optional(),
});
