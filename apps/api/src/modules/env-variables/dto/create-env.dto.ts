import { z } from 'zod';

export const createEnvSchema = z.object({
  key: z.string().min(1, 'Key is required').max(255, 'Key is too long'),
  value: z.string().min(1, 'Value is required'),
  target: z.enum(['PRODUCTION', 'PREVIEW', 'DEVELOPMENT']),
});

export type CreateEnvDto = z.infer<typeof createEnvSchema>;
