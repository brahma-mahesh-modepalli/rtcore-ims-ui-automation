/**
 * Configuration Manager
 * =====================
 * Loads environment-specific configuration based on ENVIRONMENT variable
 * 
 * Usage:
 *   import { getConfig } from './config';
 *   const config = getConfig();
 *   
 * Set environment:
 *   ENVIRONMENT=qa npm test
 *   ENVIRONMENT=staging npm test
 *   ENVIRONMENT=prod npm test
 */

import { qaConfig } from './qa.config';
import { stagingConfig } from './staging.config';
import { prodConfig } from './prod.config';

export type EnvironmentType = 'qa' | 'staging' | 'prod';

export type ConfigType = typeof qaConfig;

/**
 * Get configuration based on current environment
 * Defaults to QA if ENVIRONMENT variable is not set
 */
export function getConfig(): ConfigType {
  const env = (process.env.ENVIRONMENT || 'qa').toLowerCase() as EnvironmentType;

  switch (env) {
    case 'staging':
      return stagingConfig;
    case 'prod':
      return prodConfig;
    case 'qa':
    default:
      return qaConfig;
  }
}

/**
 * Export the active config
 */
export const CONFIG = getConfig();

/**
 * Re-export individual configs for direct access if needed
 */
export { qaConfig, stagingConfig, prodConfig };
