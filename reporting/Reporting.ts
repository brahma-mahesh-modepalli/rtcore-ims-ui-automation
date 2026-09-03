/**
 * Reporting Utility
 * =================
 * Lightweight, dependency-free logger used across tests, the database layer,
 * and utilities. Wraps console output with a level prefix and timestamp so
 * logs are easy to scan. Does NOT know about DB credentials or secrets -
 * callers must never pass sensitive values (passwords, tokens) to it.
 */

function timestamp(): string {
  return new Date().toISOString();
}

export const Reporting = {
  info(message: string): void {
    console.log(`[${timestamp()}] [INFO] ${message}`);
  },

  pass(message: string): void {
    console.log(`[${timestamp()}] [PASS] ${message}`);
  },

  fail(message: string): void {
    console.error(`[${timestamp()}] [FAIL] ${message}`);
  },

  error(message: string): void {
    console.error(`[${timestamp()}] [ERROR] ${message}`);
  },
};
