import { z } from 'zod';

const isValidTrustProxyValue = (val: unknown): boolean => {
  if (typeof val === 'boolean') return true;
  if (typeof val === 'number') return Number.isInteger(val) && val >= 0;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (['true', 'false', 'loopback', 'linklocal', 'uniquelocal'].includes(trimmed.toLowerCase())) {
      return true;
    }
    if (/^\d+$/.test(trimmed)) {
      return true;
    }
    // Check comma-separated IPs or CIDRs
    const parts = trimmed.split(',').map((p) => p.trim());
    const ipOrCidrRegex = /^([0-9a-fA-F:.]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(\/\d{1,3})?$/;
    return parts.length > 0 && parts.every((p) => ipOrCidrRegex.test(p) || ['loopback', 'linklocal', 'uniquelocal'].includes(p.toLowerCase()));
  }
  return false;
};

const trustProxySchema = z
  .union([z.string(), z.number(), z.boolean()])
  .optional()
  .default('1')
  .superRefine((val, ctx) => {
    if (!isValidTrustProxyValue(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid TRUST_PROXY value: "${val}". Must be a boolean ('true'/'false'), non-negative integer hop count, or standard proxy subnet/IP list ('loopback', 'linklocal', 'uniquelocal', CIDR).`,
      });
    }
  })
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val;
    const str = String(val).trim();
    if (str.toLowerCase() === 'true') return 1;
    if (str.toLowerCase() === 'false') return false;
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    return str;
  });

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'], {
        message: "NODE_ENV must be 'development', 'production', or 'test'",
      })
      .optional(),
    PORT: z
      .string()
      .default('5000')
      .transform((val) => Number(val))
      .pipe(z.number().int().positive('PORT must be a positive integer')),
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
    TRUST_PROXY: trustProxySchema,
  })
  .superRefine((data, ctx) => {
    // 1. Detect deployed environments where NODE_ENV is missing
    const hasDeploymentIndicator = Boolean(
      process.env.RENDER ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.FLY_APP_NAME ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.VERCEL
    );

    const isNonLocalFrontend =
      data.FRONTEND_URL &&
      !data.FRONTEND_URL.includes('localhost') &&
      !data.FRONTEND_URL.includes('127.0.0.1');

    if (!data.NODE_ENV) {
      if (hasDeploymentIndicator || isNonLocalFrontend) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'NODE_ENV is required and must be explicitly set to "production" in deployed environments.',
          path: ['NODE_ENV'],
        });
        return;
      }
    }

    const resolvedEnv = data.NODE_ENV || 'development';

    // 2. Validate FRONTEND_URL origins
    const origins = data.FRONTEND_URL.split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    if (origins.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FRONTEND_URL must contain at least one valid HTTP(S) origin.',
        path: ['FRONTEND_URL'],
      });
    }

    for (const origin of origins) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(origin);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `FRONTEND_URL contains an invalid URL: "${origin}".`,
          path: ['FRONTEND_URL'],
        });
        continue;
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `FRONTEND_URL protocol must be http: or https:, got: "${parsedUrl.protocol}".`,
          path: ['FRONTEND_URL'],
        });
      }

      // Production-specific FRONTEND_URL rules
      if (resolvedEnv === 'production') {
        if (parsedUrl.protocol !== 'https:') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Production FRONTEND_URL must use HTTPS: "${origin}".`,
            path: ['FRONTEND_URL'],
          });
        }

        const hostname = parsedUrl.hostname.toLowerCase();
        if (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname === '0.0.0.0' ||
          hostname === '::1'
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Production FRONTEND_URL cannot use loopback/localhost: "${origin}".`,
            path: ['FRONTEND_URL'],
          });
        }
      }
    }

    // 3. Production Cloudinary & Cookie requirements
    if (resolvedEnv === 'production') {
      if (!data.CLOUDINARY_CLOUD_NAME || data.CLOUDINARY_CLOUD_NAME.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_CLOUD_NAME is required in production environment.',
          path: ['CLOUDINARY_CLOUD_NAME'],
        });
      }
      if (!data.CLOUDINARY_API_KEY || data.CLOUDINARY_API_KEY.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_KEY is required in production environment.',
          path: ['CLOUDINARY_API_KEY'],
        });
      }
      if (!data.CLOUDINARY_API_SECRET || data.CLOUDINARY_API_SECRET.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_SECRET is required in production environment.',
          path: ['CLOUDINARY_API_SECRET'],
        });
      }

      if (data.COOKIE_DOMAIN) {
        const domain = data.COOKIE_DOMAIN.toLowerCase().trim();
        if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'COOKIE_DOMAIN cannot be localhost in production environment.',
            path: ['COOKIE_DOMAIN'],
          });
        }
      }
    }
  })
  .transform((data) => ({
    ...data,
    NODE_ENV: data.NODE_ENV || 'development',
  }));

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(source: Record<string, unknown> = process.env): EnvConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error('❌ Environment validation failed:\n' + errorDetails);
    throw new Error('Environment validation failed:\n' + errorDetails);
  }
  return result.data;
}

export const env = validateEnv();
