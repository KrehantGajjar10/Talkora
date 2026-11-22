import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z
      .string()
      .default('5000')
      .transform((val) => Number(val))
      .pipe(z.number().int().positive()),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    ACCESS_TOKEN_SECRET: z
      .string()
      .min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters long'),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_DOMAIN: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    TRUST_PROXY: z
      .union([z.string(), z.number(), z.boolean()])
      .optional()
      .default('1')
      .transform((val) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val;
        if (val === 'true' || val === '1') return 1;
        if (val === 'false' || val === '0') return false;
        const num = Number(val);
        return isNaN(num) ? false : num;
      }),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      const frontend = data.FRONTEND_URL.toLowerCase();
      if (
        frontend.includes('localhost') ||
        frontend.includes('127.0.0.1') ||
        frontend.includes('0.0.0.0')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FRONTEND_URL cannot be localhost or loopback in production environment',
          path: ['FRONTEND_URL'],
        });
      }

      if (!data.CLOUDINARY_CLOUD_NAME || data.CLOUDINARY_CLOUD_NAME.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_CLOUD_NAME is required in production environment',
          path: ['CLOUDINARY_CLOUD_NAME'],
        });
      }
      if (!data.CLOUDINARY_API_KEY || data.CLOUDINARY_API_KEY.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_KEY is required in production environment',
          path: ['CLOUDINARY_API_KEY'],
        });
      }
      if (!data.CLOUDINARY_API_SECRET || data.CLOUDINARY_API_SECRET.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_SECRET is required in production environment',
          path: ['CLOUDINARY_API_SECRET'],
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error('❌ Environment validation failed:\n' + errorDetails);
    throw new Error('Environment validation failed');
  }
  return result.data;
}

export const env = validateEnv();
