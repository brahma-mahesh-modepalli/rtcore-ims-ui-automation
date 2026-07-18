/**
 * Base Test Fixture
 * =================
 * Extends the built-in Playwright `test` object with custom fixtures
 * so that page objects are automatically instantiated and available
 * in every test without boilerplate.
 *
 * Usage in spec files:
 *   import { test, expect } from '../fixtures/baseTest';
 *   test('example', async ({ rtcDashboardLoginPage }) => { ... });
 *
 * Each fixture receives the same `page` instance Playwright creates
 * per test, keeping everything isolated.
 */

import { test as base } from '@playwright/test';
import { RTCDashboardLoginPage } from '../pages/Login/RTCDashboardLoginPage';

/** Declare the custom fixture types */
type CustomFixtures = {
  rtcDashboardLoginPage: RTCDashboardLoginPage;
};

/**
 * Extended test object that provides page-object fixtures.
 * Re-export `expect` from here so spec files only need one import.
 */
export const test = base.extend<CustomFixtures>({
  /** Instantiate RTCDashboardLoginPage and hand it to the test */
  rtcDashboardLoginPage: async ({ page }, use) => {
    const rtcDashboardLoginPage = new RTCDashboardLoginPage(page);
    await use(rtcDashboardLoginPage);
  },
});

export { expect } from '@playwright/test';
