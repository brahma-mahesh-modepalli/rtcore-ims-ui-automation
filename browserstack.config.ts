import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import { ENV } from './constants/env';
import packageJson from './package.json';

dotenv.config();

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const buildName = process.env.BROWSERSTACK_BUILD_NAME || 'rtcore-ims-ui-automation - feature/inventory-tests';
const projectName = process.env.BROWSERSTACK_PROJECT_NAME || 'RTCore IMS UI Automation';
const localEnabled = process.env.BROWSERSTACK_LOCAL !== 'false';
const localIdentifier = process.env.BROWSERSTACK_LOCAL_IDENTIFIER || 'rtcore-ims-ui-automation-local';
const playwrightVersion = packageJson.devDependencies['@playwright/test'].replace(/^[^\d]*/, '');

function browserStackEndpoint(input: {
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion: string;
}): string {
  if (!username || !accessKey) {
    throw new Error(
      'BrowserStack credentials missing. Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY in .env or CI secrets.',
    );
  }

  const capabilities = {
    browser: input.browser,
    browser_version: input.browserVersion || 'latest',
    os: input.os,
    os_version: input.osVersion,
    project: projectName,
    build: buildName,
    name: 'Playwright test',
    'browserstack.username': username,
    'browserstack.accessKey': accessKey,
    'browserstack.local': localEnabled,
    'browserstack.localIdentifier': localIdentifier,
    'browserstack.debug': true,
    'browserstack.console': 'info',
    'browserstack.networkLogs': true,
    'client.playwrightVersion': playwrightVersion,
  };

  return `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
    JSON.stringify(capabilities),
  )}`;
}

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-browserstack' }],
  ],
  globalSetup: localEnabled ? './browserstack.global-setup.ts' : undefined,
  use: {
    baseURL: ENV.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 20_000,
    headless: true,
  },
  outputDir: 'test-results/browserstack',
  projects: [
    {
      name: 'browserstack-chrome-windows',
      use: {
        browserName: 'chromium',
        connectOptions: {
          wsEndpoint: browserStackEndpoint({
            browser: 'chrome',
            os: 'Windows',
            osVersion: '11',
          }),
        },
      },
    },
    {
      name: 'browserstack-edge-windows',
      use: {
        browserName: 'chromium',
        connectOptions: {
          wsEndpoint: browserStackEndpoint({
            browser: 'edge',
            os: 'Windows',
            osVersion: '11',
          }),
        },
      },
    },
  ],
});
