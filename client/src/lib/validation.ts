import { z } from 'zod';

// User input validation schemas
export const usernameSchema = z.string()
  .min(2, 'Username must be at least 2 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z]+$/, 'Username can only contain letters')
  .refine(
    (username) => {
      const lowerUsername = username.toLowerCase();
      const banned = ['admin', 'staff', 'mod', 'moderator', 'owner', 'root', 'system'];
      return !banned.includes(lowerUsername);
    },
    'This username is reserved'
  );

export const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password is too long');

export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .optional();

export const profileUpdateSchema = z.object({
  username: usernameSchema.optional(),
  skinColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  hairColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  height: z.number().min(36, 'Height too low').max(120, 'Height too high').optional(),
  weight: z.number().min(50, 'Weight too low').max(500, 'Weight too high').optional(),
  fitnessGoal: z.enum(['weight_loss', 'muscle_gain', 'general_fitness', 'endurance']).optional(),
  measurementUnit: z.enum(['metric', 'imperial']).optional(),
});

export const workoutSessionSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100, 'Name too long'),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(600, 'Duration too long'),
  totalVolume: z.number().min(0, 'Volume cannot be negative').optional(),
  perceivedEffort: z.number().min(1, 'RPE must be at least 1').max(10, 'RPE cannot exceed 10').optional(),
  exercises: z.array(z.object({
    exerciseId: z.number(),
    sets: z.array(z.object({
      reps: z.number().min(0).max(1000),
      weight: z.number().min(0).max(1000).optional(),
      duration: z.number().min(0).optional(),
      completed: z.boolean()
    }))
  })).optional()
});

export const dailyQuestUpdateSchema = z.object({
  questType: z.enum(['hydration', 'steps', 'protein', 'sleep']),
  completed: z.boolean()
});

export const battleActionSchema = z.object({
  action: z.enum(['attack', 'defend', 'special']),
  monsterId: z.number().positive('Invalid monster ID')
});

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/<[^>]*>/g, ''); // Remove HTML tags
}

export function sanitizeNumber(input: any): number | null {
  const num = Number(input);
  return isNaN(num) ? null : num;
}

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: any): T {
  const sanitized = sanitizeObject(data);
  return schema.parse(sanitized);
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (typeof obj === 'number') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

// Rate limiting helpers
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}