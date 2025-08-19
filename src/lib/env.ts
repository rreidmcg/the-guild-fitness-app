import { z } from 'zod';

/**
 * Centralized env validation. Extend as needed.
 * Move required keys from optional() to strict schemas as you wire them up.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Runtime config (examples; adjust to your stack)
  DATABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
