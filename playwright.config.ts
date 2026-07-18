/**
 * Playwright Configuration File
 * ==============================
 * Centralised config for all test execution settings:
 * - Base URL, timeouts, retries
 * - Browser projects (Chromium, Firefox, WebKit)
 * - Reporter configuration
 * - Parallel execution settings
 */

import { defineConfig, devices } from '@playwright/test';
import { ENV } from './constants/env';

export default defineConfig({
  /* Directory that contains the test files */
  testDir: './tests',

  /* Maximum time one test can run (30 seconds) */
  timeout: 30_000,

  /* Assertion-level timeout */
  expect: {
    timeout: 5_000,
  },

  /* Run tests in series (one after another) instead of parallel */
  fullyParallel: false,

  /* Fail the build on CI if test.only is left in source */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests – once locally, twice on CI */
  retries: process.env.CI ? 2 : 1,

  /* Limit parallel workers – use 1 worker locally to see tests sequentially */
  workers: process.env.CI ? '50%' : 1,

  /* Reporters – HTML report persisted to playwright-report/ */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* Shared settings applied to every project */
  use: {
    /* Base URL used by page.goto('/path') */
    baseURL: ENV.BASE_URL,

    /* Capture trace for every test */
    trace: 'on',

    /* Capture screenshot after every test */
    screenshot: 'on',

    /* Record video for every test */
    video: 'on',

    /* Default navigation timeout */
    navigationTimeout: 15_000,

    /* Default action timeout */
    actionTimeout: 10_000,

    /* Run browsers in headed mode so the browser window is visible with actions */
    headless: false,
  },

  /* Output directory for test artifacts (screenshots, videos, traces) */
  outputDir: 'test-results',

  /* Browser projects */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /*
         * Auto-deny native Chrome permission prompts such as
         * "Access other devices on your local network" so headed
         * runs are not blocked by the browser dialog.
         */
        launchOptions: {
          args: [
            '--deny-permission-prompts',
            '--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessPermissionPrompt',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
