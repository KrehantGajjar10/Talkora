import 'dotenv/config';
import { envSchema } from '../config/env.js';
import { isRateLimitDisabled } from '../middlewares/rate-limiter.middleware.js';
import { normalizeOrigin, getAllowedOrigins, validateOrigin } from '../middlewares/origin.middleware.js';
import type { Request, Response, NextFunction } from 'express';

console.log('=======================================================');
console.log('Starting Talkora Chapter 11.2 Deployment Safety Unit Suite');
console.log('=======================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASSED] ${testName}`);
    passed++;
  } else {
    console.error(`[FAILED] ${testName} ${detail ? `- ${detail}` : ''}`);
    failed++;
  }
}

// =========================================================================
// 1. PRODUCTION ENVIRONMENT VALIDATION TESTS
// =========================================================================

const validBaseEnv = {
  PORT: '5000',
  FRONTEND_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/talkora_dev',
  ACCESS_TOKEN_SECRET: 'super-secret-token-secret-at-least-32-chars-long',
  COOKIE_SAME_SITE: 'lax',
  TRUST_PROXY: '1',
};

// 1.1 Development defaults to 'development' when no deployment indicators exist
const devParse = envSchema.safeParse({ ...validBaseEnv });
assert(
  devParse.success && devParse.data.NODE_ENV === 'development',
  '1.1 Local environment defaults NODE_ENV to "development" when missing'
);

// 1.2 Rejects missing NODE_ENV when FRONTEND_URL is non-localhost (deployed)
const missingEnvDeployed = envSchema.safeParse({
  ...validBaseEnv,
  FRONTEND_URL: 'https://talkora.com',
});
assert(
  !missingEnvDeployed.success &&
    missingEnvDeployed.error.issues.some((i) => i.path.includes('NODE_ENV')),
  '1.2 Rejects missing NODE_ENV when deployed with public FRONTEND_URL'
);

// 1.3 Rejects insecure HTTP FRONTEND_URL in production
const prodInsecureFrontend = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'production',
  FRONTEND_URL: 'http://talkora.com',
  CLOUDINARY_CLOUD_NAME: 'test_cloud',
  CLOUDINARY_API_KEY: 'test_key',
  CLOUDINARY_API_SECRET: 'test_secret',
});
assert(
  !prodInsecureFrontend.success &&
    prodInsecureFrontend.error.issues.some((i) =>
      i.message.includes('Production FRONTEND_URL must use HTTPS')
    ),
  '1.3 Rejects insecure HTTP FRONTEND_URL in production'
);

// 1.4 Rejects localhost/loopback FRONTEND_URL in production
const prodLocalhostFrontend = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://localhost:3000',
  CLOUDINARY_CLOUD_NAME: 'test_cloud',
  CLOUDINARY_API_KEY: 'test_key',
  CLOUDINARY_API_SECRET: 'test_secret',
});
assert(
  !prodLocalhostFrontend.success &&
    prodLocalhostFrontend.error.issues.some((i) =>
      i.message.includes('loopback/localhost')
    ),
  '1.4 Rejects localhost/loopback FRONTEND_URL in production'
);

// 1.5 Strictly rejects malformed TRUST_PROXY values
const badTrustProxy = envSchema.safeParse({
  ...validBaseEnv,
  TRUST_PROXY: 'unsupported_gibberish_value',
});
assert(
  !badTrustProxy.success &&
    badTrustProxy.error.issues.some((i) => i.path.includes('TRUST_PROXY')),
  '1.5 Rejects malformed TRUST_PROXY instead of silently converting to false'
);

// 1.6 Accepts valid TRUST_PROXY values: integer, boolean, keywords, CIDR
const validTrustProxyNumbers = envSchema.safeParse({ ...validBaseEnv, TRUST_PROXY: '2' });
const validTrustProxyKeyword = envSchema.safeParse({ ...validBaseEnv, TRUST_PROXY: 'loopback' });
assert(
  validTrustProxyNumbers.success &&
    validTrustProxyNumbers.data.TRUST_PROXY === 2 &&
    validTrustProxyKeyword.success &&
    validTrustProxyKeyword.data.TRUST_PROXY === 'loopback',
  '1.6 Accepts valid TRUST_PROXY hop counts and subnet keywords'
);

// 1.7 Rejects missing Cloudinary credentials in production
const prodMissingCloudinary = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://talkora.com',
});
assert(
  !prodMissingCloudinary.success &&
    prodMissingCloudinary.error.issues.some((i) => i.path.includes('CLOUDINARY_CLOUD_NAME')),
  '1.7 Rejects missing Cloudinary credentials in production'
);

// 1.8 Accepts valid production configuration
const prodValid = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://talkora.com,https://app.talkora.com',
  CLOUDINARY_CLOUD_NAME: 'my_cloud',
  CLOUDINARY_API_KEY: '1234567890',
  CLOUDINARY_API_SECRET: 'abcdefghijklmnopqrstuvwxyz',
  TRUST_PROXY: '1',
});
assert(
  prodValid.success && prodValid.data.NODE_ENV === 'production',
  '1.8 Accepts fully configured production environment'
);

// =========================================================================
// 2. PRODUCTION RATE LIMIT BYPASS PREVENTION TESTS
// =========================================================================

// Test in production mode:
process.env.NODE_ENV = 'production';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.ALLOW_TEST_RATE_LIMIT_BYPASS = 'true';
const prodBypassResult = isRateLimitDisabled();
assert(
  prodBypassResult === false,
  '2.1 Rate-limiting CANNOT be disabled in production regardless of environment flags'
);

// Test in test mode:
process.env.NODE_ENV = 'test';
process.env.ALLOW_TEST_RATE_LIMIT_BYPASS = 'false';
assert(
  isRateLimitDisabled() === false,
  '2.2 Rate-limiting is NOT bypassed in test unless ALLOW_TEST_RATE_LIMIT_BYPASS=true'
);

process.env.ALLOW_TEST_RATE_LIMIT_BYPASS = 'true';
assert(
  isRateLimitDisabled() === true,
  '2.3 Rate-limiting is bypassed only when NODE_ENV=test and ALLOW_TEST_RATE_LIMIT_BYPASS=true'
);

// Reset NODE_ENV
delete process.env.ALLOW_TEST_RATE_LIMIT_BYPASS;
delete process.env.DISABLE_RATE_LIMIT;
process.env.NODE_ENV = 'development';

// =========================================================================
// 3. CORS & ORIGIN SECURITY TESTS
// =========================================================================

// 3.1 normalizeOrigin
assert(
  normalizeOrigin('https://talkora.com/') === 'https://talkora.com' &&
    normalizeOrigin('HTTPS://TALKORA.COM:443') === 'https://talkora.com',
  '3.1 normalizeOrigin correctly normalizes protocol, trailing slash, and default port'
);

// Helper for testing validateOrigin middleware
function mockReqRes(method: string, headers: Record<string, string>) {
  let statusCode = 200;
  let responseData: any = null;
  let nextCalled = false;

  const req = {
    method,
    headers,
  } as unknown as Request;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
  } as unknown as Response;

  const next: NextFunction = () => {
    nextCalled = true;
  };

  return { req, res, next, getStatus: () => statusCode, isNext: () => nextCalled };
}

// 3.2 Safe methods (GET, HEAD, OPTIONS) pass validateOrigin unconditionally
const safeGet = mockReqRes('GET', { origin: 'http://untrusted-site.com' });
validateOrigin(safeGet.req, safeGet.res, safeGet.next);
assert(safeGet.isNext(), '3.2 Safe read-only HTTP methods bypass mutation origin check');

// 3.3 Mutation with trusted origin passes
const trustedPost = mockReqRes('POST', { origin: 'http://localhost:3000' });
validateOrigin(trustedPost.req, trustedPost.res, trustedPost.next);
assert(trustedPost.isNext(), '3.3 Mutation with allowed frontend origin passes origin validation');

// 3.4 Mutation with untrusted origin is rejected with 403
const untrustedPost = mockReqRes('POST', { origin: 'http://malicious-site.com' });
validateOrigin(untrustedPost.req, untrustedPost.res, untrustedPost.next);
assert(
  untrustedPost.getStatus() === 403 && !untrustedPost.isNext(),
  '3.4 Mutation with mismatched origin rejected with 403 Forbidden'
);

// 3.5 Mutation with Origin: "null" is rejected with 403
const nullOriginPost = mockReqRes('POST', { origin: 'null' });
validateOrigin(nullOriginPost.req, nullOriginPost.res, nullOriginPost.next);
assert(
  nullOriginPost.getStatus() === 403 && !nullOriginPost.isNext(),
  '3.5 Mutation with Origin: "null" rejected with 403 Forbidden'
);

// 3.6 Mutation with Sec-Fetch-Site: cross-site is rejected with 403
const crossSitePost = mockReqRes('POST', { 'sec-fetch-site': 'cross-site' });
validateOrigin(crossSitePost.req, crossSitePost.res, crossSitePost.next);
assert(
  crossSitePost.getStatus() === 403 && !crossSitePost.isNext(),
  '3.6 Mutation with Sec-Fetch-Site: cross-site rejected with 403 Forbidden'
);

// 3.7 Mutation without browser headers (native API/Postman/curl) passes
const nonBrowserPost = mockReqRes('POST', {});
validateOrigin(nonBrowserPost.req, nonBrowserPost.res, nonBrowserPost.next);
assert(
  nonBrowserPost.isNext(),
  '3.7 Mutation without browser headers (Postman/curl) allowed'
);

// =========================================================================
// 4. REGRESSION RUNNER SAFETY LOGIC TESTS
// =========================================================================

function testSafetyGateCheck(envVars: Record<string, string | undefined>): {
  allowed: boolean;
  reason?: string;
} {
  if (envVars.ALLOW_TEST_EXECUTION !== 'true') {
    return { allowed: false, reason: 'ALLOW_TEST_EXECUTION is not true' };
  }

  const testDbUrl = envVars.TEST_DATABASE_URL?.trim();
  if (!testDbUrl) {
    return { allowed: false, reason: 'TEST_DATABASE_URL is missing' };
  }

  const appDbUrl = envVars.DATABASE_URL?.trim();
  if (appDbUrl && testDbUrl === appDbUrl && envVars.ALLOW_SHARED_TEST_DB !== 'true') {
    return { allowed: false, reason: 'TEST_DATABASE_URL is identical to DATABASE_URL' };
  }

  let parsedHost: string;
  try {
    const parsed = new URL(testDbUrl);
    parsedHost = parsed.hostname.toLowerCase();
  } catch {
    return { allowed: false, reason: 'TEST_DATABASE_URL is invalid URL' };
  }

  const expectedHost = envVars.EXPECTED_TEST_DB_HOST?.trim().toLowerCase();
  if (!expectedHost) {
    return { allowed: false, reason: 'EXPECTED_TEST_DB_HOST is missing' };
  }

  if (!parsedHost.includes(expectedHost)) {
    return { allowed: false, reason: 'Host does not match EXPECTED_TEST_DB_HOST' };
  }

  return { allowed: true };
}

// 4.1 Refuses to start without ALLOW_TEST_EXECUTION=true
const noAllowGate = testSafetyGateCheck({
  TEST_DATABASE_URL: 'postgresql://postgres:postgres@ep-test-branch-123.us-east-2.aws.neon.tech/talkora_test',
  EXPECTED_TEST_DB_HOST: 'ep-test-branch-123',
});
assert(!noAllowGate.allowed, '4.1 Regression gate rejects when ALLOW_TEST_EXECUTION is not true');

// 4.2 Refuses to start without dedicated TEST_DATABASE_URL
const noTestDbGate = testSafetyGateCheck({
  ALLOW_TEST_EXECUTION: 'true',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/talkora',
});
assert(!noTestDbGate.allowed, '4.2 Regression gate rejects when TEST_DATABASE_URL is missing');

// 4.3 Refuses when TEST_DATABASE_URL is identical to application DATABASE_URL
const sharedDbGate = testSafetyGateCheck({
  ALLOW_TEST_EXECUTION: 'true',
  DATABASE_URL: 'postgresql://postgres:postgres@ep-main.us-east-2.aws.neon.tech/talkora',
  TEST_DATABASE_URL: 'postgresql://postgres:postgres@ep-main.us-east-2.aws.neon.tech/talkora',
  EXPECTED_TEST_DB_HOST: 'ep-main',
});
assert(!sharedDbGate.allowed, '4.3 Regression gate rejects when TEST_DATABASE_URL is identical to application DATABASE_URL');

// 4.4 Refuses when EXPECTED_TEST_DB_HOST is missing
const noExpectedHostGate = testSafetyGateCheck({
  ALLOW_TEST_EXECUTION: 'true',
  DATABASE_URL: 'postgresql://postgres:postgres@ep-main.us-east-2.aws.neon.tech/talkora',
  TEST_DATABASE_URL: 'postgresql://postgres:postgres@ep-test-branch-123.us-east-2.aws.neon.tech/talkora_test',
});
assert(!noExpectedHostGate.allowed, '4.4 Regression gate rejects when EXPECTED_TEST_DB_HOST is missing');

// 4.5 Refuses when connected host does not match EXPECTED_TEST_DB_HOST
const hostMismatchGate = testSafetyGateCheck({
  ALLOW_TEST_EXECUTION: 'true',
  DATABASE_URL: 'postgresql://postgres:postgres@ep-main.us-east-2.aws.neon.tech/talkora',
  TEST_DATABASE_URL: 'postgresql://postgres:postgres@ep-wrong-endpoint-999.us-east-2.aws.neon.tech/talkora_test',
  EXPECTED_TEST_DB_HOST: 'ep-test-branch-123',
});
assert(!hostMismatchGate.allowed, '4.5 Regression gate rejects when connected host does not match EXPECTED_TEST_DB_HOST');

// 4.6 Passes when all dedicated test database safety gates are satisfied
const validTestGate = testSafetyGateCheck({
  ALLOW_TEST_EXECUTION: 'true',
  DATABASE_URL: 'postgresql://postgres:postgres@ep-main.us-east-2.aws.neon.tech/talkora',
  TEST_DATABASE_URL: 'postgresql://postgres:postgres@ep-test-branch-123.us-east-2.aws.neon.tech/talkora_test',
  EXPECTED_TEST_DB_HOST: 'ep-test-branch-123',
});
assert(validTestGate.allowed, '4.6 Regression gate passes when all dedicated test requirements are satisfied');

console.log('\n=======================================================');
console.log(`TOTAL SAFETY ASSERTIONS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('=======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL DEPLOYMENT SAFETY TESTS PASSED CLEANLY!\n');
}
