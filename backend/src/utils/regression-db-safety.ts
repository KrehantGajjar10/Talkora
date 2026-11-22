export interface RegressionDbSafetyConfig {
  ALLOW_TEST_EXECUTION?: string;
  TEST_DATABASE_URL?: string;
  DATABASE_URL?: string;
  EXPECTED_TEST_DB_HOST?: string;
  EXPECTED_TEST_DB_NAME?: string;
  PROTECTED_DATABASE_HOSTS?: string;
  [key: string]: string | undefined;
}

export interface ValidationSuccess {
  isValid: true;
  normalizedTestHost: string;
  normalizedTestDbName: string;
  identity: {
    host: string;
    dbName: string;
    expectedDbHost: string;
    expectedDbName: string;
  };
}

export interface ValidationFailure {
  isValid: false;
  reason: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export function parseDatabaseIdentity(
  rawUrl: string
): { host: string; dbName: string } | null {
  try {
    const parsed = new URL(rawUrl);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol.toLowerCase())) {
      return null;
    }
    const host = parsed.hostname.trim().toLowerCase();
    const dbName = parsed.pathname.replace(/^\/+/, '').split('?')[0].trim().toLowerCase();
    if (!host || !dbName) {
      return null;
    }
    return { host, dbName };
  } catch {
    return null;
  }
}

export function validateRegressionDbSafety(
  config: RegressionDbSafetyConfig
): ValidationResult {
  // 1. Explicit execution approval gate
  if (config.ALLOW_TEST_EXECUTION !== 'true') {
    return {
      isValid: false,
      reason: 'ALLOW_TEST_EXECUTION=true is required to execute regression tests.',
    };
  }

  // 2. Strict dedicated TEST_DATABASE_URL requirement (never fall back to application DATABASE_URL)
  const testDbUrl = config.TEST_DATABASE_URL?.trim();
  if (!testDbUrl) {
    return {
      isValid: false,
      reason: 'TEST_DATABASE_URL is required. The runner will NEVER fall back to DATABASE_URL.',
    };
  }

  const testIdentity = parseDatabaseIdentity(testDbUrl);
  if (!testIdentity) {
    return {
      isValid: false,
      reason:
        'TEST_DATABASE_URL is not a valid URL or PostgreSQL connection string, or is missing hostname/database name.',
    };
  }

  // 3. EXPECTED_TEST_DB_HOST must be provided and must EXACTLY match (exact equality, no substring matching)
  const expectedHost = config.EXPECTED_TEST_DB_HOST?.trim().toLowerCase();
  if (!expectedHost) {
    return {
      isValid: false,
      reason:
        'EXPECTED_TEST_DB_HOST must be explicitly configured to verify the target test database/branch identity.',
    };
  }

  if (testIdentity.host !== expectedHost) {
    return {
      isValid: false,
      reason: `TEST_DATABASE_URL hostname "${testIdentity.host}" does not match EXPECTED_TEST_DB_HOST "${expectedHost}". Substring matching is prohibited.`,
    };
  }

  // 4. EXPECTED_TEST_DB_NAME must be provided and must EXACTLY match
  const expectedDbName = config.EXPECTED_TEST_DB_NAME?.trim().toLowerCase();
  if (!expectedDbName) {
    return {
      isValid: false,
      reason:
        'EXPECTED_TEST_DB_NAME must be explicitly configured to verify the target test database/branch identity.',
    };
  }

  if (testIdentity.dbName !== expectedDbName) {
    return {
      isValid: false,
      reason: `TEST_DATABASE_URL database name "${testIdentity.dbName}" does not match EXPECTED_TEST_DB_NAME "${expectedDbName}".`,
    };
  }

  // 5. PROTECTED_DATABASE_HOSTS must be provided and must NOT match testHost
  const rawProtectedHosts = config.PROTECTED_DATABASE_HOSTS?.trim();
  if (!rawProtectedHosts) {
    return {
      isValid: false,
      reason:
        'PROTECTED_DATABASE_HOSTS must be explicitly configured with protected hostnames (e.g. production/main endpoints).',
    };
  }

  const protectedHosts = rawProtectedHosts
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  if (protectedHosts.length === 0) {
    return {
      isValid: false,
      reason: 'PROTECTED_DATABASE_HOSTS list cannot be empty.',
    };
  }

  if (protectedHosts.includes(testIdentity.host)) {
    return {
      isValid: false,
      reason: `TEST_DATABASE_URL hostname "${testIdentity.host}" matches a protected production database host in PROTECTED_DATABASE_HOSTS. Execution denied.`,
    };
  }

  // 6. Compare normalized database identity against application DATABASE_URL
  if (config.DATABASE_URL?.trim()) {
    const appIdentity = parseDatabaseIdentity(config.DATABASE_URL.trim());
    if (appIdentity) {
      if (
        testIdentity.host === appIdentity.host &&
        testIdentity.dbName === appIdentity.dbName
      ) {
        return {
          isValid: false,
          reason:
            'TEST_DATABASE_URL resolves to the same database identity (hostname and database name) as the application DATABASE_URL. A dedicated test database or isolated branch is strictly required. No shared database override exists.',
        };
      }
    }
  }

  return {
    isValid: true,
    normalizedTestHost: testIdentity.host,
    normalizedTestDbName: testIdentity.dbName,
    identity: {
      host: testIdentity.host,
      dbName: testIdentity.dbName,
      expectedDbHost: expectedHost,
      expectedDbName: expectedDbName,
    },
  };
}
