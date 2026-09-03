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
import { TestDataRepository } from '../test-data/TestDataRepository';

/** Declare the custom fixture types */
type CustomFixtures = {
  rtcDashboardLoginPage: RTCDashboardLoginPage;
  /** DB-backed test data access, e.g. `await testData.getStoreById(1034)` */
  testData: TestDataRepository;
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
});

export { expect } from '@playwright/test';
