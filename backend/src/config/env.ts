import { z } from 'zod';
import { isIP } from 'node:net';

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
    if (parts.length === 0) return false;
    for (const part of parts) {
      if (['loopback', 'linklocal', 'uniquelocal'].includes(part.toLowerCase())) {
        continue;
      }
      if (part.includes('/')) {
        const [ip, prefixStr] = part.split('/');
        if (!ip || !prefixStr || !/^\d+$/.test(prefixStr)) {
          return false;
        }
        const prefix = Number(prefixStr);
        const ipType = isIP(ip);
        if (ipType === 4 && (prefix < 0 || prefix > 32)) return false;
        if (ipType === 6 && (prefix < 0 || prefix > 128)) return false;
        if (ipType === 0) return false;
      } else {
        if (isIP(part) === 0) return false;
      }
    }
    return true;
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
        message: `Invalid TRUST_PROXY value: "${val}". Must be a boolean ('true'/'false'), non-negative integer hop count, or valid proxy subnet/IP/CIDR list.`,
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

    // Platform deployment indicator variables for deterministic environment detection
    RENDER: z.string().optional(),
    RAILWAY_ENVIRONMENT: z.string().optional(),
    FLY_APP_NAME: z.string().optional(),
    AWS_EXECUTION_ENV: z.string().optional(),
    VERCEL: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Detect deployed environments where NODE_ENV is missing
    const hasDeploymentIndicator = Boolean(
      data.RENDER ||
      data.RAILWAY_ENVIRONMENT ||
      data.FLY_APP_NAME ||
      data.AWS_EXECUTION_ENV ||
      data.VERCEL
    );

    const origins = data.FRONTEND_URL.split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const isNonLocalFrontend = origins.some((origin) => {
      try {
        const parsed = new URL(origin);
        const host = parsed.hostname.toLowerCase();
        return (
          host !== 'localhost' &&
          host !== '127.0.0.1' &&
          host !== '0.0.0.0' &&
          host !== '::1' &&
          !host.endsWith('.localhost') &&
          !host.endsWith('.local')
        );
      } catch {
        return false;
      }
    });

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

      // Origin purity checks: origins cannot have userinfo, subpaths, queries, or hashes
      if (parsedUrl.username || parsedUrl.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `FRONTEND_URL origin cannot contain credentials/userinfo: "${origin}".`,
          path: ['FRONTEND_URL'],
        });
      }

      if (parsedUrl.pathname !== '' && parsedUrl.pathname !== '/') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `FRONTEND_URL must be a pure origin without path: "${origin}".`,
          path: ['FRONTEND_URL'],
        });
      }

      if (parsedUrl.search) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `FRONTEND_URL origin cannot contain query parameters: "${origin}".`,
          path: ['FRONTEND_URL'],
        });
      }

      if (parsedUrl.hash) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `FRONTEND_URL origin cannot contain a URL hash/fragment: "${origin}".`,
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
          hostname === '::1' ||
          hostname.endsWith('.localhost') ||
          hostname.endsWith('.local')
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Production FRONTEND_URL cannot use loopback/localhost: "${origin}".`,
            path: ['FRONTEND_URL'],
          });
        }
      }
    }

    // 3. COOKIE_DOMAIN validation
    if (data.COOKIE_DOMAIN && data.COOKIE_DOMAIN.trim() !== '') {
      const cookieDomain = data.COOKIE_DOMAIN.trim().toLowerCase();
      // Domain syntax validation: RFC 6265
      // Optional leading dot, followed by labels separated by dots
      const domainWithoutLeadingDot = cookieDomain.startsWith('.')
        ? cookieDomain.slice(1)
        : cookieDomain;

      if (
        cookieDomain.includes('://') ||
        cookieDomain.includes(':') ||
        cookieDomain.includes('/') ||
        cookieDomain.includes(' ') ||
        !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(domainWithoutLeadingDot)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid COOKIE_DOMAIN format: "${data.COOKIE_DOMAIN}". Must be a valid domain without protocol, port, or path.`,
          path: ['COOKIE_DOMAIN'],
        });
      }

      if (resolvedEnv === 'production') {
        if (
          domainWithoutLeadingDot === 'localhost' ||
          domainWithoutLeadingDot === '127.0.0.1' ||
          domainWithoutLeadingDot.endsWith('.localhost') ||
          domainWithoutLeadingDot.endsWith('.local') ||
          isIP(domainWithoutLeadingDot) !== 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `COOKIE_DOMAIN cannot be localhost or an IP address in production: "${data.COOKIE_DOMAIN}".`,
            path: ['COOKIE_DOMAIN'],
          });
        }
      }
    }

    // 4. Cloudinary credentials validation
    const hasCloudName = Boolean(data.CLOUDINARY_CLOUD_NAME && data.CLOUDINARY_CLOUD_NAME.trim() !== '');
    const hasApiKey = Boolean(data.CLOUDINARY_API_KEY && data.CLOUDINARY_API_KEY.trim() !== '');
    const hasApiSecret = Boolean(data.CLOUDINARY_API_SECRET && data.CLOUDINARY_API_SECRET.trim() !== '');

    // Partial credentials check across all environments
    if (hasCloudName || hasApiKey || hasApiSecret) {
      if (!hasCloudName || !hasApiKey || !hasApiSecret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Partial Cloudinary credentials provided. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must all be supplied together.',
          path: ['CLOUDINARY_CLOUD_NAME'],
        });
      }
    }

    // Strict requirement in production
    if (resolvedEnv === 'production') {
      if (!hasCloudName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_CLOUD_NAME is required in production environment.',
          path: ['CLOUDINARY_CLOUD_NAME'],
        });
      }
      if (!hasApiKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_KEY is required in production environment.',
          path: ['CLOUDINARY_API_KEY'],
        });
      }
      if (!hasApiSecret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLOUDINARY_API_SECRET is required in production environment.',
          path: ['CLOUDINARY_API_SECRET'],
        });
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
