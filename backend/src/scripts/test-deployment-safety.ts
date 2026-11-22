import 'dotenv/config';
import { envSchema } from '../config/env.js';
import { isRateLimitDisabled } from '../middlewares/rate-limiter.middleware.js';
import { normalizeOrigin, getAllowedOrigins, validateOrigin } from '../middlewares/origin.middleware.js';
import { validateRegressionDbSafety } from '../utils/regression-db-safety.js';
import type { Request, Response, NextFunction } from 'express';

console.log('=======================================================');
console.log('Starting Talkora Chapter 11.3 Deployment Safety Unit Suite');
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

// 1.3 Rejects missing NODE_ENV when deployment indicator (RENDER) is present
const missingEnvRender = envSchema.safeParse({
  ...validBaseEnv,
  RENDER: 'true',
});
assert(
  !missingEnvRender.success &&
    missingEnvRender.error.issues.some((i) => i.path.includes('NODE_ENV')),
  '1.3 Rejects missing NODE_ENV when deployment platform indicator (RENDER) is present'
);

// 1.4 Rejects insecure HTTP FRONTEND_URL in production
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
  '1.4 Rejects insecure HTTP FRONTEND_URL in production'
);

// 1.5 Rejects localhost/loopback FRONTEND_URL in production
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
  '1.5 Rejects localhost/loopback FRONTEND_URL in production'
);

// 1.6 Rejects FRONTEND_URL with user credentials
const userinfoFrontend = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'development',
  FRONTEND_URL: 'https://user:pass@talkora.com',
});
assert(
  !userinfoFrontend.success &&
    userinfoFrontend.error.issues.some((i) =>
      i.message.includes('credentials/userinfo')
    ),
  '1.6 Rejects FRONTEND_URL containing user credentials'
);

// 1.7 Rejects FRONTEND_URL with non-root subpath
const subpathFrontend = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'development',
  FRONTEND_URL: 'https://talkora.com/app/login',
});
assert(
  !subpathFrontend.success &&
    subpathFrontend.error.issues.some((i) =>
      i.message.includes('pure origin without path')
    ),
  '1.7 Rejects FRONTEND_URL containing URL path'
);

// 1.8 Rejects FRONTEND_URL with query string or hash
const queryFrontend = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'development',
  FRONTEND_URL: 'https://talkora.com?redirect=true#section',
});
assert(
  !queryFrontend.success &&
    queryFrontend.error.issues.some((i) =>
      i.message.includes('query parameters') || i.message.includes('hash')
    ),
  '1.8 Rejects FRONTEND_URL containing query parameters or fragment hash'
);

// 1.9 Rejects malformed TRUST_PROXY values and invalid CIDR
const badTrustProxy = envSchema.safeParse({
  ...validBaseEnv,
  TRUST_PROXY: 'unsupported_gibberish_value',
});
const badCidrTrustProxy = envSchema.safeParse({
  ...validBaseEnv,
  TRUST_PROXY: '192.168.1.1/35', // IPv4 prefix > 32
});
assert(
  !badTrustProxy.success &&
    !badCidrTrustProxy.success &&
    badTrustProxy.error.issues.some((i) => i.path.includes('TRUST_PROXY')) &&
    badCidrTrustProxy.error.issues.some((i) => i.path.includes('TRUST_PROXY')),
  '1.9 Rejects malformed TRUST_PROXY and out-of-range CIDR prefixes'
);

// 1.10 Accepts valid TRUST_PROXY values: integer, boolean, keywords, valid CIDR
const validTrustProxyNumbers = envSchema.safeParse({ ...validBaseEnv, TRUST_PROXY: '2' });
const validTrustProxyKeyword = envSchema.safeParse({ ...validBaseEnv, TRUST_PROXY: 'loopback' });
const validTrustProxyCidr = envSchema.safeParse({ ...validBaseEnv, TRUST_PROXY: '10.0.0.0/8,192.168.0.0/16' });
assert(
  validTrustProxyNumbers.success &&
    validTrustProxyNumbers.data.TRUST_PROXY === 2 &&
    validTrustProxyKeyword.success &&
    validTrustProxyKeyword.data.TRUST_PROXY === 'loopback' &&
    validTrustProxyCidr.success,
  '1.10 Accepts valid TRUST_PROXY hop counts, subnet keywords, and valid CIDR ranges'
);

// 1.11 Rejects missing Cloudinary credentials in production
const prodMissingCloudinary = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://talkora.com',
});
assert(
  !prodMissingCloudinary.success &&
    prodMissingCloudinary.error.issues.some((i) => i.path.includes('CLOUDINARY_CLOUD_NAME')),
  '1.11 Rejects missing Cloudinary credentials in production'
);

// 1.12 Rejects partial Cloudinary credentials in development
const devPartialCloudinary = envSchema.safeParse({
  ...validBaseEnv,
  CLOUDINARY_CLOUD_NAME: 'only_cloud_name',
});
assert(
  !devPartialCloudinary.success &&
    devPartialCloudinary.error.issues.some((i) =>
      i.message.includes('Partial Cloudinary credentials provided')
    ),
  '1.12 Rejects partial Cloudinary credentials across all environments'
);

// 1.13 Rejects malformed COOKIE_DOMAIN format
const badCookieDomain = envSchema.safeParse({
  ...validBaseEnv,
  COOKIE_DOMAIN: 'https://talkora.com:5000/path',
});
assert(
  !badCookieDomain.success &&
    badCookieDomain.error.issues.some((i) => i.path.includes('COOKIE_DOMAIN')),
  '1.13 Rejects COOKIE_DOMAIN containing scheme, port, or path'
);

// 1.14 Rejects COOKIE_DOMAIN as localhost or IP address in production
const prodIpCookieDomain = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://talkora.com',
  CLOUDINARY_CLOUD_NAME: 'my_cloud',
  CLOUDINARY_API_KEY: '123',
  CLOUDINARY_API_SECRET: 'abc',
  COOKIE_DOMAIN: '127.0.0.1',
});
assert(
  !prodIpCookieDomain.success &&
    prodIpCookieDomain.error.issues.some((i) => i.path.includes('COOKIE_DOMAIN')),
  '1.14 Rejects COOKIE_DOMAIN as IP address or localhost in production'
);

// 1.15 Accepts valid fully configured production environment
const prodValid = envSchema.safeParse({
  ...validBaseEnv,
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://talkora.com,https://app.talkora.com',
  COOKIE_DOMAIN: '.talkora.com',
  CLOUDINARY_CLOUD_NAME: 'my_cloud',
  CLOUDINARY_API_KEY: '1234567890',
  CLOUDINARY_API_SECRET: 'abcdefghijklmnopqrstuvwxyz',
  TRUST_PROXY: '1',
});
assert(
  prodValid.success && prodValid.data.NODE_ENV === 'production',
  '1.15 Accepts fully configured production environment'
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
// 4. REGRESSION DATABASE SAFETY MODULE TESTS (validateRegressionDbSafety)
// =========================================================================

const validSafetyParams = {
  ALLOW_TEST_EXECUTION: 'true',
  DATABASE_URL: 'postgresql://postgres:postgres@ep-main-123.us-east-2.aws.neon.tech/talkora',
  TEST_DATABASE_URL: 'postgresql://postgres:postgres@ep-test-branch-456.us-east-2.aws.neon.tech/talkora_test',
  EXPECTED_TEST_DB_HOST: 'ep-test-branch-456.us-east-2.aws.neon.tech',
  EXPECTED_TEST_DB_NAME: 'talkora_test',
  PROTECTED_DATABASE_HOSTS: 'ep-prod-branch.us-east-2.aws.neon.tech,ep-main-123.us-east-2.aws.neon.tech',
};

// 4.1 Rejects when ALLOW_TEST_EXECUTION is not true
const r1 = validateRegressionDbSafety({ ...validSafetyParams, ALLOW_TEST_EXECUTION: 'false' });
assert(!r1.isValid && r1.reason.includes('ALLOW_TEST_EXECUTION'), '4.1 Rejects when ALLOW_TEST_EXECUTION is not true');

// 4.2 Rejects when TEST_DATABASE_URL is missing
const r2 = validateRegressionDbSafety({ ...validSafetyParams, TEST_DATABASE_URL: '' });
assert(!r2.isValid && r2.reason.includes('TEST_DATABASE_URL'), '4.2 Rejects when TEST_DATABASE_URL is missing');

// 4.3 Rejects when TEST_DATABASE_URL is an invalid URL
const r3 = validateRegressionDbSafety({ ...validSafetyParams, TEST_DATABASE_URL: 'invalid-url-string' });
assert(!r3.isValid && (r3.reason.includes('valid URL') || r3.reason.includes('connection string')), '4.3 Rejects when TEST_DATABASE_URL is invalid URL');

// 4.4 Rejects when EXPECTED_TEST_DB_HOST is missing
const r4 = validateRegressionDbSafety({ ...validSafetyParams, EXPECTED_TEST_DB_HOST: '' });
assert(!r4.isValid && r4.reason.includes('EXPECTED_TEST_DB_HOST'), '4.4 Rejects when EXPECTED_TEST_DB_HOST is missing');

// 4.5 Rejects when EXPECTED_TEST_DB_NAME is missing
const r5 = validateRegressionDbSafety({ ...validSafetyParams, EXPECTED_TEST_DB_NAME: '' });
assert(!r5.isValid && r5.reason.includes('EXPECTED_TEST_DB_NAME'), '4.5 Rejects when EXPECTED_TEST_DB_NAME is missing');

// 4.6 Rejects when host does not match EXPECTED_TEST_DB_HOST
const r6 = validateRegressionDbSafety({
  ...validSafetyParams,
  EXPECTED_TEST_DB_HOST: 'ep-different-host.us-east-2.aws.neon.tech',
});
assert(!r6.isValid && r6.reason.includes('does not match EXPECTED_TEST_DB_HOST'), '4.6 Rejects host mismatch');

// 4.7 Rejects substring match exploit on hostname
const r7 = validateRegressionDbSafety({
  ...validSafetyParams,
  TEST_DATABASE_URL: 'postgresql://user:pass@ep-test-branch-456.us-east-2.aws.neon.tech.attacker.com/talkora_test',
  EXPECTED_TEST_DB_HOST: 'ep-test-branch-456.us-east-2.aws.neon.tech',
});
assert(!r7.isValid && r7.reason.includes('does not match EXPECTED_TEST_DB_HOST'), '4.7 Rejects substring match attack on hostname');

// 4.8 Rejects when dbName does not match EXPECTED_TEST_DB_NAME
const r8 = validateRegressionDbSafety({
  ...validSafetyParams,
  EXPECTED_TEST_DB_NAME: 'different_db_name',
});
assert(!r8.isValid && r8.reason.includes('does not match EXPECTED_TEST_DB_NAME'), '4.8 Rejects database name mismatch');

// 4.9 Rejects substring match exploit on database name
const r9 = validateRegressionDbSafety({
  ...validSafetyParams,
  TEST_DATABASE_URL: 'postgresql://user:pass@ep-test-branch-456.us-east-2.aws.neon.tech/talkora_test_extra',
  EXPECTED_TEST_DB_NAME: 'talkora_test',
});
assert(!r9.isValid && r9.reason.includes('does not match EXPECTED_TEST_DB_NAME'), '4.9 Rejects substring match attack on database name');

// 4.10 Rejects when host is listed in PROTECTED_DATABASE_HOSTS
const r10 = validateRegressionDbSafety({
  ...validSafetyParams,
  TEST_DATABASE_URL: 'postgresql://user:pass@ep-prod-branch.us-east-2.aws.neon.tech/talkora_test',
  EXPECTED_TEST_DB_HOST: 'ep-prod-branch.us-east-2.aws.neon.tech',
});
assert(!r10.isValid && r10.reason.includes('PROTECTED_DATABASE_HOSTS'), '4.10 Rejects test execution against protected production host');

// 4.11 Rejects when TEST_DATABASE_URL has identical normalized identity (host + dbName) to DATABASE_URL
const r11 = validateRegressionDbSafety({
  ...validSafetyParams,
  DATABASE_URL: 'postgresql://user:pass@ep-test-branch-456.us-east-2.aws.neon.tech/talkora_test',
});
assert(!r11.isValid && r11.reason.includes('same database identity'), '4.11 Rejects identical test and application database identity');

// 4.12 Rejects even if ALLOW_SHARED_TEST_DB is supplied (bypass completely eliminated)
const r12 = validateRegressionDbSafety({
  ...validSafetyParams,
  DATABASE_URL: 'postgresql://user:pass@ep-test-branch-456.us-east-2.aws.neon.tech/talkora_test',
  ALLOW_SHARED_TEST_DB: 'true',
});
assert(!r12.isValid, '4.12 Confirms ALLOW_SHARED_TEST_DB bypass has been completely eliminated');

// 4.13 Passes cleanly when all dedicated test database safety gates are satisfied
const r13 = validateRegressionDbSafety(validSafetyParams);
assert(
  r13.isValid &&
    r13.identity.host === 'ep-test-branch-456.us-east-2.aws.neon.tech' &&
    r13.identity.dbName === 'talkora_test',
  '4.13 Passes when all dedicated test database safety criteria are satisfied'
);

console.log('\n=======================================================');
console.log(`TOTAL SAFETY ASSERTIONS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('=======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL DEPLOYMENT & DATABASE SAFETY TESTS PASSED CLEANLY!\n');
}
