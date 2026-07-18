/**
 * Environment Configuration
 * =========================
 * Defines environment-specific URLs and properties for RTC Dashboard.
 * Switch environments via the ENVIRONMENT variable:
 *   ENVIRONMENT=prod npx playwright test
 *   ENVIRONMENT=qa npx playwright test
 */

export interface EnvironmentConfig {
  baseURL: string;
  name: string;
}

const qaConfig: EnvironmentConfig = {
  baseURL: 'http://qa-backoffice.wbhq.com/login',
  name: 'qa',
};

const prodConfig: EnvironmentConfig = {
  baseURL: 'http://dv-backoffice.wbhq.com/login',
  name: 'prod',
};

const environments: Record<string, EnvironmentConfig> = {
  qa: qaConfig,
  prod: prodConfig,
};

/** Resolve current environment from ENVIRONMENT variable (defaults to 'qa') */
const currentEnv = (process.env.ENVIRONMENT || 'qa').toLowerCase();

export const ENV_CONFIG: EnvironmentConfig = environments[currentEnv] || environments.qa;
