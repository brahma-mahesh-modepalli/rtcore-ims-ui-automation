/**
 * Helper Utilities
 * ================
 * Reusable helper functions used across tests and page objects.
 * Keep these pure / side-effect-free where possible so they stay
 * easy to test and reason about.
 */

import { Page } from '@playwright/test';
import { ENV } from '../constants/env';

/**
 * Wait for a specific number of milliseconds.
 * Prefer Playwright's built-in auto-waiting over this function;
 * use only when an explicit unconditional pause is required
 * (e.g. waiting for a third-party animation to settle).
 */
export async function waitForTimeout(page: Page, ms: number): Promise<void> {
  await page.waitForTimeout(ms);
}

/**
 * Wait until the page reaches the 'networkidle' load state.
 * Useful after actions that trigger multiple background requests.
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Take a timestamped screenshot and return its buffer.
 * Saved screenshots end up in the test-results directory.
 */
export async function takeScreenshot(
  page: Page,
  name: string,
): Promise<Buffer> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Log a message to the console with a timestamp prefix.
 * Handy for debugging long-running test suites.
 */
export function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Generate a random string of the given length.
 * Useful for creating unique usernames, emails, etc. during tests.
 */
export function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
}

/**
 * Build a full URL from a relative path using the configured base URL.
 */
export function buildUrl(path: string): string {
  const base = ENV.BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}
