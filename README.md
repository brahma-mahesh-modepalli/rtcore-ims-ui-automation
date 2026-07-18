# Playwright + TypeScript E2E Automation Framework

Production-ready end-to-end testing framework built with **Playwright** and **TypeScript**, following the **Page Object Model (POM)** design pattern. Supports multi-environment configuration (QA / Staging / PROD).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Run tests (defaults to QA environment)
npm test

# 4. Run tests against Staging
ENVIRONMENT=staging npm test

# 5. Run tests against PROD
ENVIRONMENT=prod npm test

# 6. Open HTML test report
npm run report
```

---

## Available Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm test`            | Run all tests (QA - default)       |
| `npm run test:headed` | Run tests with visible browser     |
| `npm run test:debug`  | Run tests with Playwright debugger |
| `npm run test:qa`     | Run all tests against QA           |
| `npm run test:prod`   | Run all tests against PROD         |
| `npm run report`      | Open HTML test report              |

---

## Environment Configuration

Configuration is managed through the `config/` directory with environment-specific files:

```
config/
├── qa.config.ts           # QA environment (default)
├── staging.config.ts      # Staging environment
├── prod.config.ts         # Production environment
└── index.ts               # Config loader & exporter
```

### Running Tests Against Different Environments

```bash
# QA (default)
npm test

# Staging
ENVIRONMENT=staging npm test

# Production
ENVIRONMENT=prod npm test
```

### Configuration Structure

Each environment includes:

```typescript
{
  name: string,                              // Environment name
  baseURL: string,                           // Base URL
  dashboardURL: string,                      // Dashboard URL
  credentials: {
    admin: { username, password, role },     // Admin credentials
    manager: { username, password, role },   // Manager credentials
    user: { username, password, role }       // User credentials
  },
  timeout: number,                           // Request timeout (ms)
  navigationTimeout: number                  // Navigation timeout (ms)
}
```

### Using Config in Tests

```typescript
import { CONFIG } from '../../config';

// Access URLs
const url = CONFIG.dashboardURL;

// Access credentials
const admin = CONFIG.credentials.admin;
const { username, password } = admin;

// Access timeouts
const timeout = CONFIG.timeout;
```

---

## Project Structure

```
playwright-framework/
│
├── config/                         # Environment-specific configurations
│   ├── qa.config.ts                #   QA environment
│   ├── staging.config.ts           #   Staging environment
│   ├── prod.config.ts              #   Production environment
│   └── index.ts                    #   Config loader
│
├── tests/                          # Test specification files
│   └── EPIC-RCSP-119/
│       └── RCSP-115.spec.ts        #   Example: Stock Count Navigation
│
├── pages/                          # Page Object Model classes
│   ├── Login/
│   │   └── RTCDashboardLoginPage.ts
│   └── Stock Count/
│       ├── DailyShiftCountPage.ts
│       ├── WeeklyCountPage.ts
│       ├── MonthlyCountPage.ts
│       └── StockCountPage.ts
│
├── fixtures/                       # Custom Playwright fixtures
│   └── baseTest.ts                 #   Extended test with page objects
│
├── utils/                          # Shared utilities
│   ├── helpers.ts                  #   Helper functions
│   ├── testData.ts                 #   Test data loader
│   └── databaseReader.ts           #   Database utilities
│
├── constants/                      # Constants
│   ├── env.ts                      #   Environment constants
│   └── environments.ts             #   Environment definitions
│
├── test-data/                      # JSON test data files
│   ├── config.json
│   ├── environments.json
│   ├── users.json
│   └── testCases.json
│
├── playwright.config.ts            # Playwright configuration
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript settings
└── README.md                       # This file
```

---

## Page Object Model (POM)

Page Objects encapsulate locators and actions for each page:

```typescript
// pages/Login/RTCDashboardLoginPage.ts
export class RTCDashboardLoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByPlaceholder('you@whataburger.com');
    this.passwordInput = page.getByPlaceholder('Enter password');
    this.loginButton = page.getByRole('button', { name: 'Sign in' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.usernameInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
```

### Using Page Objects in Tests

```typescript
import { test } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';

test('Login Test', async ({ page }) => {
  const loginPage = new RTCDashboardLoginPage(page);
  
  await page.goto(CONFIG.dashboardURL);
  await loginPage.login(
    CONFIG.credentials.admin.username,
    CONFIG.credentials.admin.password
  );
});
```

---

## Writing a New Test

1. Create a test file in `tests/` directory:

```typescript
// tests/example.spec.ts
import { test } from '@playwright/test';
import { CONFIG } from '../config';
import { log } from '../utils/helpers';

test('Example Test', async ({ page }) => {
  log('Starting test...');
  
  await page.goto(CONFIG.dashboardURL);
  // Add test steps
  
  log('Test completed successfully');
});
```

2. Run the test:

```bash
npm test -- tests/example.spec.ts
```

---

## Adding a New Environment

1. Create a new config file in `config/`:

```typescript
// config/dev.config.ts
export const devConfig = {
  name: 'Development',
  baseURL: 'https://dev-backoffice.wbhq.com',
  dashboardURL: 'https://dev-backoffice.wbhq.com/dashboard',
  loginURL: 'https://dev-backoffice.wbhq.com/login',
  credentials: {
    admin: {
      username: 'admin@whataburger-ims.com',
      password: 'admin123',
      role: 'admin',
    },
    // ... more roles
  },
  timeout: 30000,
  navigationTimeout: 10000,
} as const;
```

2. Update `config/index.ts`:

```typescript
import { devConfig } from './dev.config';

export function getConfig(): ConfigType {
  const env = (process.env.ENVIRONMENT || 'qa').toLowerCase();
  
  switch (env) {
    case 'dev':
      return devConfig;
    // ... other cases
  }
}
```

3. Run tests against the new environment:

```bash
ENVIRONMENT=dev npm test
```

---

## Running Specific Tests

```bash
# All tests
npm test

# Specific test file
npm test -- tests/EPIC-RCSP-119/RCSP-115.spec.ts

# Tests matching pattern
npm test -- -g "Navigation"

# Headed mode (visible browser)
npm run test:headed

# Debug mode
npm run test:debug
```

---

## Test Artifacts

Playwright automatically captures:

- **Screenshots** - On test failure
- **Videos** - Full test execution (if enabled)
- **Traces** - For debugging complex issues

View artifacts in the HTML report:

```bash
npm run report
```

---

## Example Test: Stock Count Navigation

```typescript
import { test } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { StockCountPage } from '../../pages/Stock Count/StockCountPage';

test.describe('RCSP-115 - Stock Count Navigation', () => {
  test('Navigate through all count pages', async ({ page }) => {
    log('=== Stock Count Navigation Test Started ===');
    
    const loginPage = new RTCDashboardLoginPage(page);
    const stockCountPage = new StockCountPage(page);

    // Login
    await page.goto(CONFIG.dashboardURL);
    await loginPage.login(
      CONFIG.credentials.admin.username,
      CONFIG.credentials.admin.password
    );

    // Navigate through pages
    await stockCountPage.navigateToDailyShiftCount();
    await stockCountPage.navigateToWeeklyCount();
    await stockCountPage.navigateToMonthlyCount();
    
    log('=== TEST PASSED ===');
  });
});
```

---

## Best Practices

1. **Use Config for URLs & Credentials** - Never hardcode sensitive data
2. **Use Page Objects** - Encapsulate locators and actions
3. **Explicit Waits** - Use Playwright's auto-waiting
4. **Descriptive Logs** - Use the `log()` helper function
5. **Environment Variables** - Switch environments with `ENVIRONMENT` variable

---

## Troubleshooting

### Playwright Browser Issues
```bash
npx playwright install --with-deps
```

### Clear Test Artifacts
```bash
rm -rf test-results playwright-report
```

### Test Timeout
Increase timeout in `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 10 * 1000,
  navigationTimeout: 30 * 1000,
}
```

---

## Support

For more information:
- [Playwright Docs](https://playwright.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

## Project Structure

```
playwright-framework/
│
├── tests/                      # Test specification files
│   ├── login.spec.ts           #   Login page test scenarios
│   └── dashboard.spec.ts       #   Dashboard page test scenarios
│
├── pages/                      # Page Object Model classes
│   ├── LoginPage.ts            #   Login page locators, actions, validations
│   └── DashboardPage.ts        #   Dashboard page locators, actions, validations
│
├── fixtures/                   # Custom Playwright test fixtures
│   └── baseTest.ts             #   Extends `test` with page object injection
│
├── utils/                      # Shared utilities
│   ├── testData.ts             #   Test users, messages, constants
│   └── helpers.ts              #   Helper functions (logging, screenshots, waits)
│
├── constants/                  # Configuration & constants
│   ├── environments.ts         #   QA & PROD environment definitions
│   └── env.ts                  #   Resolved BASE_URL, timeouts, active env
│
├── playwright.config.ts        # Playwright configuration (browsers, timeouts, artifacts)
├── package.json                # Dependencies & npm scripts
├── tsconfig.json               # TypeScript compiler settings
├── test-results/               # Generated: screenshots, videos, traces
└── playwright-report/          # Generated: HTML test report
```

---

## How the Framework Works

Here is the complete data & execution flow:

```
┌─────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLE                  │
│              ENVIRONMENT=prod / qa (default)             │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│            constants/environments.ts                     │
│  Defines QA & PROD configs: URLs, users, properties     │
│  Exports: ENV_CONFIG (selected by ENVIRONMENT var)       │
└──────────────────────┬──────────────────────────────────┘
                       ▼
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐    ┌───────────────────┐
│  constants/env.ts │    │ utils/testData.ts  │
│  BASE_URL,        │    │ TEST_USERS,        │
│  TIMEOUT,         │    │ MESSAGES           │
│  ENVIRONMENT name │    │ (from ENV_CONFIG)  │
└────────┬─────────┘    └─────────┬─────────┘
         ▼                        ▼
┌──────────────────┐    ┌───────────────────┐
│ playwright.config │    │ tests/*.spec.ts    │
│ baseURL, browsers │    │ Use TEST_USERS &   │
│ timeouts, artifacts│   │ MESSAGES constants │
└──────────────────┘    └─────────┬─────────┘
                                  ▼
                        ┌───────────────────┐
                        │ fixtures/baseTest  │
                        │ Injects loginPage, │
                        │ dashboardPage into │
                        │ every test         │
                        └─────────┬─────────┘
                                  ▼
                        ┌───────────────────┐
                        │ pages/*.ts         │
                        │ Locators, actions, │
                        │ validation methods │
                        └───────────────────┘
```

---

## Environment Configuration

### How it works

The framework supports multiple environments. Each environment has its own URL, user credentials, and properties.

**File:** `constants/environments.ts`

```typescript
// Each environment implements this interface
interface EnvironmentConfig {
  baseURL: string;                // Application URL
  name: string;                   // Environment label
  users: {                        // User credentials per role
    valid: { username: string; password: string };
    lockedOut: { username: string; password: string };
    invalid: { username: string; password: string };
    // ... more user types
  };
  expectedProductCount: number;   // Environment-specific expected values
  dashboardTitle: string;
}
```

### Switching environments

```bash
# QA (default – no variable needed)
npx playwright test

# PROD
$env:ENVIRONMENT="prod"; npx playwright test    # PowerShell
ENVIRONMENT=prod npx playwright test            # Bash

# Override just the URL (any environment)
$env:BASE_URL="https://custom.example.com"; npx playwright test
```

### Adding a new environment

See [Adding a New Environment](#adding-a-new-environment) section below.

---

## Page Object Model (POM)

Each web page has a corresponding TypeScript class in `pages/` that encapsulates:

| Concern        | What it contains                                    |
| -------------- | --------------------------------------------------- |
| **Locators**   | Element selectors (using `data-test` attributes)    |
| **Actions**    | Methods that interact with the page (click, fill)   |
| **Validations**| Assertion methods to verify page state              |

### Example: LoginPage.ts

```typescript
export class LoginPage {
  // ── Locators (defined once, reused everywhere) ──
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton:   Locator;
  readonly errorMessage:  Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton   = page.locator('[data-test="login-button"]');
    this.errorMessage  = page.locator('[data-test="error"]');
  }

  // ── Actions ──
  async navigate() {
    await this.page.goto('/');           // Uses baseURL from config
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  // ── Validations ──
  async validatePageLoaded() {
    await expect(this.loginLogo).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
  }

  async validateSuccessfulLogin() {
    await expect(this.page).toHaveURL(/inventory/);
  }

  async validateLoginError(expectedMessage: string) {
    await expect(this.errorMessage).toContainText(expectedMessage);
  }
}
```

### Why POM?

- **No duplicate selectors** – change a locator in one place, every test updates.
- **Readable tests** – tests read like English: `loginPage.login('user', 'pass')`.
- **Easy maintenance** – when the UI changes, only the Page Object needs updating.

---

## Custom Fixtures

**File:** `fixtures/baseTest.ts`

Playwright fixtures automatically create and inject page objects into your tests — no manual setup or `new LoginPage(page)` boilerplate in test files.

```typescript
// baseTest.ts – how it works
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));       // Created automatically per test
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));   // Created automatically per test
  },
});

export { expect } from '@playwright/test';
```

### Using fixtures in tests

```typescript
// In any spec file:
import { test, expect } from '../fixtures/baseTest';  // NOT from '@playwright/test'

test('example', async ({ loginPage, dashboardPage }) => {
  // loginPage and dashboardPage are ready to use!
  await loginPage.navigate();
  await loginPage.login('user', 'pass');
  await dashboardPage.verifyDashboardLoaded();
});
```

**Key rule:** Always import `test` and `expect` from `fixtures/baseTest`, NOT from `@playwright/test` directly.

---

## Test Data Management

### Layer 1: Environment Config (`constants/environments.ts`)

Defines all credentials and expected values per environment. This is the single source of truth.

### Layer 2: Test Data Exports (`utils/testData.ts`)

Re-exports from the active environment config. Tests import from here:

```typescript
import { TEST_USERS, MESSAGES } from '../utils/testData';

// Available users:
TEST_USERS.VALID          // { username: 'standard_user', password: 'secret_sauce' }
TEST_USERS.LOCKED_OUT     // { username: 'locked_out_user', password: 'secret_sauce' }
TEST_USERS.INVALID        // { username: 'invalid_user', password: 'wrong_password' }
TEST_USERS.PROBLEM        // { username: 'problem_user', password: 'secret_sauce' }
TEST_USERS.PERFORMANCE    // { username: 'performance_glitch_user', ... }
TEST_USERS.ERROR          // { username: 'error_user', ... }
TEST_USERS.VISUAL         // { username: 'visual_user', ... }

// Available messages:
MESSAGES.LOGIN_ERROR       // 'Epic sadface: Username and password do not match...'
MESSAGES.LOCKED_OUT_ERROR  // 'Epic sadface: Sorry, this user has been locked out.'
MESSAGES.DASHBOARD_TITLE   // 'Products'
```

### Layer 3: Tests (`tests/*.spec.ts`)

Tests never hardcode credentials or URLs — they always reference `TEST_USERS` and `MESSAGES`.

---

## Writing a New Test

### Step-by-step

1. **Create a spec file** in `tests/` (e.g., `tests/cart.spec.ts`)
2. **Import** from `baseTest` (not `@playwright/test`)
3. **Use fixtures** to access page objects
4. **Use test data** from `testData.ts`

### Template

```typescript
import { test, expect } from '../fixtures/baseTest';
import { TEST_USERS } from '../utils/testData';

test.describe('Feature Name', () => {
  // Runs before each test in this describe block
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login(TEST_USERS.VALID.username, TEST_USERS.VALID.password);
    await loginPage.validateSuccessfulLogin();
  });

  test('should do something', async ({ dashboardPage, page }) => {
    // Arrange – set up preconditions (already done in beforeEach)

    // Act – perform the action
    await dashboardPage.openCart();

    // Assert – verify the result
    await expect(page).toHaveURL(/cart/);
  });

  test('should do something else', async ({ dashboardPage }) => {
    await dashboardPage.verifyDashboardLoaded();
  });
});
```

### Run your new test

```bash
npx playwright test tests/cart.spec.ts --project=chromium
```

---

## Adding a New Page Object

### Step-by-step

1. **Create the page class** in `pages/` (e.g., `pages/CartPage.ts`)
2. **Register it as a fixture** in `fixtures/baseTest.ts`
3. **Use it in tests**

### 1. Create `pages/CartPage.ts`

```typescript
import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../utils/helpers';

export class CartPage {
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(private readonly page: Page) {
    this.cartItems = page.locator('[data-test="inventory-item"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async verifyCartLoaded(): Promise<void> {
    log('Verifying cart page loaded');
    await expect(this.page).toHaveURL(/cart/);
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
```

### 2. Register in `fixtures/baseTest.ts`

```typescript
import { CartPage } from '../pages/CartPage';

type CustomFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  cartPage: CartPage;             // ← Add here
};

export const test = base.extend<CustomFixtures>({
  // ... existing fixtures ...
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));  // ← Add here
  },
});
```

### 3. Use in tests

```typescript
test('should open cart', async ({ dashboardPage, cartPage }) => {
  await dashboardPage.openCart();
  await cartPage.verifyCartLoaded();
});
```

---

## Adding a New Environment

Edit `constants/environments.ts`:

```typescript
const stagingConfig: EnvironmentConfig = {
  baseURL: 'https://staging.saucedemo.com',
  name: 'staging',
  users: {
    valid: { username: 'stage_user', password: 'stage_pass' },
    // ... define all user types
  },
  expectedProductCount: 6,
  dashboardTitle: 'Products',
};

const environments: Record<string, EnvironmentConfig> = {
  qa: qaConfig,
  prod: prodConfig,
  staging: stagingConfig,   // ← Add here
};
```

Then run:

```bash
$env:ENVIRONMENT="staging"; npx playwright test
```

---

## Test Artifacts

The framework captures **3 artifacts for every test**:

| Artifact           | Format     | Description                                    |
| ------------------ | ---------- | ---------------------------------------------- |
| **Screenshot**     | `.png`     | Captured at the end of each test               |
| **Video**          | `.webm`    | Full recording of the test execution           |
| **Trace**          | `.zip`     | Playwright trace with DOM snapshots & timeline  |

### Where to find them

- **Raw files:** `test-results/` directory (one subfolder per test)
- **HTML report:** `playwright-report/` — run `npm run report` to view all artifacts interactively

### Viewing a trace file

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

This opens the Trace Viewer with:
- Step-by-step action timeline
- DOM snapshot at each step
- Network requests
- Console logs

### Configuration (in `playwright.config.ts`)

```typescript
use: {
  trace: 'on',        // 'on' | 'off' | 'on-first-retry' | 'retain-on-failure'
  screenshot: 'on',   // 'on' | 'off' | 'only-on-failure'
  video: 'on',        // 'on' | 'off' | 'on-first-retry' | 'retain-on-failure'
}
```

---

## Playwright Config Explained

**File:** `playwright.config.ts`

| Setting              | Value          | Purpose                                      |
| -------------------- | -------------- | -------------------------------------------- |
| `testDir`            | `./tests`      | Where Playwright looks for spec files        |
| `timeout`            | `30,000 ms`    | Max time per test                            |
| `expect.timeout`     | `5,000 ms`     | Max time for each `expect()` assertion       |
| `fullyParallel`      | `true`         | Tests run in parallel across files           |
| `retries`            | `1` (CI: `2`)  | Auto-retry failed tests                      |
| `baseURL`            | From `ENV`     | Prepended to `page.goto('/')` calls          |
| `headless`           | `false`        | Browser window is visible                    |
| `navigationTimeout`  | `15,000 ms`    | Max time for `page.goto()` to complete       |
| `actionTimeout`      | `10,000 ms`    | Max time for clicks, fills, etc.             |
| `trace`              | `on`           | Capture trace for every test                 |
| `screenshot`         | `on`           | Screenshot after every test                  |
| `video`              | `on`           | Record video for every test                  |
| `projects`           | 3 browsers     | Chromium, Firefox, WebKit                    |

---

## CI / CD

Set `CI=true` to enable CI-optimised settings:

```bash
CI=true npx playwright test
```

CI mode changes:
- **2 retries** on failure (vs 1 locally)
- **50% worker concurrency** (vs all CPUs locally)
- **`test.only` is forbidden** (build fails if left in code)

### Example GitHub Actions workflow

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
        env:
          CI: true
          ENVIRONMENT: qa
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: |
            playwright-report/
            test-results/
```

---

## Troubleshooting

| Problem | Solution |
| ------- | -------- |
| `Cannot find module '@playwright/test'` | Run `npm install` |
| Browser not installed | Run `npx playwright install` |
| Tests fail with timeout | Increase `timeout` in `playwright.config.ts` |
| Can't open report | Kill existing report server, then `npm run report` |
| Wrong environment | Check `$env:ENVIRONMENT` / `echo $ENVIRONMENT` |
| Port already in use for report | The previous `show-report` is still running; close it first |

---

## AI Integration (MCP)

See [MCP_SETUP.md](MCP_SETUP.md) for instructions on configuring the Playwright MCP Server for AI-assisted test generation and debugging.
