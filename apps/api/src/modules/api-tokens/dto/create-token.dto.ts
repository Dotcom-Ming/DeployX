import { z } from 'zod';

export const createTokenSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  scopes: z
    .array(z.string().min(1))
    .min(1, 'At least one scope is required')
    .max(20, 'Too many scopes'),
  expiresAt: z.string().datetime().optional(),
});

export type CreateTokenDto = z.infer<typeof createTokenSchema>;
