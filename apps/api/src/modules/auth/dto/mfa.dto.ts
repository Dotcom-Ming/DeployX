import { z } from 'zod';

export const mfaEnableSchema = z.object({});

export const mfaVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'MFA code must be exactly 6 digits'),
});

export type MfaEnableDto = z.infer<typeof mfaEnableSchema>;
export type MfaVerifyDto = z.infer<typeof mfaVerifySchema>;
