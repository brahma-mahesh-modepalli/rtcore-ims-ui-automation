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
import { CONFIG } from '../config';
import { RTCDashboardLoginPage } from '../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../pages/Transfers/TransfersPage';
import { TestDataRepository } from '../test-data/TestDataRepository';

export const ACTIVE_STORE_CONTEXT = {
  region: '1700 San Antonio 4126314',
  market: '1708 E Central SA 4126393',
  storeName: 'WB Unit 1034',
  storeNumber: '1034',
} as const;

/** Declare the custom fixture types */
type CustomFixtures = {
  rtcDashboardLoginPage: RTCDashboardLoginPage;
  /** DB-backed test data access, e.g. `await testData.getStoreById(1034)` */
  testData: TestDataRepository;
  /** Authenticated QA session with the configured active store selected. */
  activeStoreContext: typeof ACTIVE_STORE_CONTEXT;
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

  /** Instantiate TestDataRepository and hand it to the test */
  testData: async ({}, use) => {
    const testData = new TestDataRepository();
    await use(testData);
  },

  activeStoreContext: async ({ page }, use) => {
    const loginPage = new RTCDashboardLoginPage(page);
    const transfersPage = new TransfersPage(page);

    await page.goto(CONFIG.dashboardURL);
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await loginPage.login(
      CONFIG.credentials.admin.username,
      CONFIG.credentials.admin.password,
    );
    await transfersPage.switchStore(
      ACTIVE_STORE_CONTEXT.region,
      ACTIVE_STORE_CONTEXT.market,
      ACTIVE_STORE_CONTEXT.storeName,
    );
    await transfersPage.verifyActiveStore(ACTIVE_STORE_CONTEXT.storeName);

    await use(ACTIVE_STORE_CONTEXT);
  },
});

export { expect } from '@playwright/test';
