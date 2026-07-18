/**
 * Environment Constants
 * =====================
 * Single source of truth for environment-specific configuration.
 * Delegates URL config to the environment-specific config file.
 * Override at runtime:
 *   ENVIRONMENT=prod npx playwright test
 *   BASE_URL=http://custom.example.com npx playwright test
 */

import { ENV_CONFIG } from './environments';

export const ENV = {
  /** Application base URL – resolved from environment config or override */
  BASE_URL: process.env.BASE_URL || ENV_CONFIG.baseURL,

  /** Default timeout in milliseconds for custom waits */
  DEFAULT_TIMEOUT: Number(process.env.DEFAULT_TIMEOUT) || 10_000,

  /** Current environment label (qa | prod) */
  ENVIRONMENT: ENV_CONFIG.name,
} as const;
