/**
 * Helper Utilities
 * ================
 * Reusable helper functions used across tests and page objects.
 * Keep these pure / side-effect-free where possible so they stay
 * easy to test and reason about.
 */

import { type Locator, type Page } from '@playwright/test';
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

export async function collectScrollableOptionTexts(
  page: Page,
  options: Locator,
  ignoredOption = /^select item$/i,
): Promise<string[]> {
  const collected: string[] = [];
  let previousSnapshot: string[] | undefined;
  let paginationWasClicked = false;
  let reachedScrollBottom = false;

  for (let iteration = 0; iteration < 50; iteration += 1) {
    const snapshot = (await options.allTextContents())
      .map((value) => value.replace(/\s+/g, ' ').trim())
      .filter((value) => value && !ignoredOption.test(value));
    if (snapshot.length === 0) break;

    if (!previousSnapshot || paginationWasClicked) {
      collected.push(...snapshot);
    } else {
      let overlap = Math.min(previousSnapshot.length, snapshot.length);
      while (overlap > 0) {
        const sameBoundary = previousSnapshot
          .slice(previousSnapshot.length - overlap)
          .every((value, index) => value === snapshot[index]);
        if (sameBoundary) break;
        overlap -= 1;
      }
      collected.push(...snapshot.slice(overlap));
    }

    if (reachedScrollBottom) break;

    const popup = page.locator('body > div').last();
    const nextButton = popup.getByRole('button', { name: /^(?:next|next page)$/i }).last();
    if (
      (await nextButton.isVisible().catch(() => false)) &&
      (await nextButton.isEnabled().catch(() => false))
    ) {
      await nextButton.click();
      await page.waitForTimeout(100);
      previousSnapshot = snapshot;
      paginationWasClicked = true;
      reachedScrollBottom = false;
      continue;
    }

    paginationWasClicked = false;
    const scrollResult = await options.first().evaluate((element) => {
      type ScrollNode = {
        parentElement: ScrollNode | null;
        scrollHeight: number;
        clientHeight: number;
        scrollTop: number;
      };
      let ancestor = (element as unknown as ScrollNode).parentElement;
      while (ancestor) {
        const maximumScroll = ancestor.scrollHeight - ancestor.clientHeight;
        if (maximumScroll > 1) {
          const oldScrollTop = ancestor.scrollTop;
          ancestor.scrollTop = Math.min(
            maximumScroll,
            oldScrollTop + Math.max(1, Math.floor(ancestor.clientHeight * 0.75)),
          );
          return {
            found: true,
            moved: ancestor.scrollTop > oldScrollTop,
            atBottom: ancestor.scrollTop >= maximumScroll - 1,
          };
        }
        ancestor = ancestor.parentElement;
      }
      return { found: false, moved: false, atBottom: true };
    });

    if (!scrollResult.found || !scrollResult.moved) break;
    await page.waitForTimeout(100);
    const nextSnapshot = (await options.allTextContents())
      .map((value) => value.replace(/\s+/g, ' ').trim())
      .filter((value) => value && !ignoredOption.test(value));
    if (nextSnapshot.length === snapshot.length && nextSnapshot.every((value, index) => value === snapshot[index])) {
      break;
    }
    previousSnapshot = snapshot;
    reachedScrollBottom = scrollResult.atBottom;
  }

  return collected;
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
