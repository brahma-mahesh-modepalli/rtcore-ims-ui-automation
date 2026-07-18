# Playwright TypeScript E2E Framework - Comprehensive Demo Guide

## 📋 Table of Contents
1. [What is This Framework](#what-is-this-framework)
2. [Tools Used](#tools-used)
3. [Project Architecture](#project-architecture)
4. [Page Object Model (POM) Explained](#page-object-model-explained)
5. [Project Structure & Class Responsibilities](#project-structure--class-responsibilities)
6. [How the Framework Works](#how-the-framework-works)
7. [How to Run Tests](#how-to-run-tests)
8. [Key Components Explained](#key-components-explained)
9. [Demo Scenarios](#demo-scenarios)

---

## 🎯 What is This Framework

This is a **production-ready, enterprise-grade End-to-End (E2E) testing framework** built with:
- **Playwright**: Modern browser automation tool
- **TypeScript**: Strongly-typed JavaScript for maintainability
- **Page Object Model (POM)**: Design pattern for scalable test architecture

### Key Features
✅ Multi-browser support (Chromium, Firefox, WebKit)  
✅ Multi-environment configuration (QA, PROD)  
✅ Organized folder structure for scalability  
✅ Full test artifact capture (screenshots, videos, traces)  
✅ Parallel test execution  
✅ Custom fixtures for reusable page objects  
✅ Comprehensive logging and reporting  

---

## 🛠 Tools Used

| Tool | Purpose | Version |
|------|---------|---------|
| **Playwright** | Browser automation & E2E testing | ^1.50.0 |
| **TypeScript** | Type-safe JavaScript | ^5.4.0 |
| **Node.js** | JavaScript runtime | ≥ 18 |
| **npm** | Package manager | ≥ 9 |
| **cross-env** | Environment variable management | ^10.1.0 |
| **XLSX** | Excel file reading for test data | ^0.18.5 |

### Installation
```bash
npm install
npx playwright install  # Installs browsers: Chromium, Firefox, WebKit
```

---

## 🏗 Project Architecture

```
playwright-typescript_framework/
├── constants/                      # Environment & configuration constants
│   ├── env.ts                      # Global environment variables
│   └── environments.ts             # Environment-specific configs (QA/PROD)
│
├── fixtures/                       # Custom test fixtures
│   └── baseTest.ts                 # Extended test object with page objects
│
├── pages/                          # Page Object Model classes
│   ├── Login/
│   │   └── RTCDashboardLoginPage.ts
│   └── Stock Count/
│       ├── DailyShiftCountPage.ts
│       ├── WeeklyCountPage.ts
│       ├── MonthlyCountPage.ts
│       └── CountLocationsPage.ts
│
├── tests/                          # Test specification files
│   ├── Login/
│   │   └── rtcDashboard-login.spec.ts
│   └── Stock Count/
│       ├── DailyShiftCount.spec.ts
│       ├── WeeklyCount.spec.ts
│       ├── MonthlyCount.spec.ts
│       └── CountLocations.spec.ts
│
├── utils/                          # Helper utilities
│   ├── helpers.ts                  # Common functions (logging, screenshots)
│   ├── excelReader.ts              # Excel data reading
│   └── testData.ts                 # Test data management
│
├── test-data/                      # Test data files (Excel, JSON)
├── test-results/                   # Test execution artifacts
├── playwright-report/              # HTML test reports
│
├── playwright.config.ts            # Playwright configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies & scripts
```

---

## 📘 Page Object Model (POM) Explained

### What is Page Object Model?

**POM** is a design pattern that:
- **Encapsulates** web page elements (locators) into reusable classes
- **Separates** UI interactions from test logic
- **Improves** maintainability & reduces code duplication
- **Enables** easy updates when UI changes

### Why POM?

❌ **Without POM** (Bad):
```typescript
// Test logic mixed with UI details - hard to maintain
test('login', async ({ page }) => {
  await page.locator('input[name="email"]').fill('user@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  // If the selector changes, you must update ALL tests
});
```

✅ **With POM** (Good):
```typescript
// UI details encapsulated in page object
test('login', async ({ rtcDashboardLoginPage }) => {
  await rtcDashboardLoginPage.login('user@example.com', 'password123');
  // If the selector changes, update only the page object
});
```

### POM Structure

Each page object class contains:

1. **Locators**: Define UI elements
```typescript
readonly usernameInput: Locator;
readonly passwordInput: Locator;
readonly loginButton: Locator;
```

2. **Actions**: Methods for user interactions
```typescript
async login(email: string, password: string): Promise<void> {
  await this.usernameInput.fill(email);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
}
```

3. **Validations**: Methods for assertions
```typescript
async validatePageLoaded(): Promise<void> {
  await expect(this.usernameInput).toBeVisible();
  await expect(this.passwordInput).toBeVisible();
}
```

---

## 📁 Project Structure & Class Responsibilities

### 1. **pages/Login/RTCDashboardLoginPage.ts**
**Purpose**: Page Object for RTC Dashboard login page

**Responsibilities**:
- Define locators for email input, password input, login button
- Implement login action
- Validate login page loaded
- Verify successful login

**Key Methods**:
```typescript
- navigate()                      → Navigate to login page
- login(email, password)          → Fill credentials & submit
- validatePageLoaded()            → Verify login form visible
- validateSuccessfulLogin()       → Verify login success
- expandWastageMenu()             → Click Wastage menu
- clickLogWasteButton()           → Navigate to waste logging
```

---

### 2. **pages/Stock Count/DailyShiftCountPage.ts**
**Purpose**: Page Object for Daily Shift Count feature

**Responsibilities**:
- Define locators for count table columns & buttons
- Verify page loaded with correct elements
- Handle daily shift count interactions

**Private Methods** (Internal use only):
```typescript
- verifyNewDailyShiftCountButton()  → Check "+ NEW DAILY SHIFT COUNT" visible
- verifyColumnHeaders()              → Validate table columns visible
- validateLandingPageAssertion()     → Full page validation
```

---

### 3. **pages/Stock Count/WeeklyCountPage.ts, MonthlyCountPage.ts, CountLocationsPage.ts**
**Purpose**: Page Objects for other stock count features

**Structure**: Similar to DailyShiftCountPage

---

### 4. **tests/Login/rtcDashboard-login.spec.ts**
**Purpose**: Test specifications for login functionality

**Responsibility**: 
- Orchestrate page objects to test login scenarios
- Assert expected outcomes

**Example Test**:
```typescript
test('should login with valid credentials', async ({ rtcDashboardLoginPage }) => {
  await rtcDashboardLoginPage.navigate();
  await rtcDashboardLoginPage.validatePageLoaded();
  await rtcDashboardLoginPage.login('admin@example.com', 'password123');
  await rtcDashboardLoginPage.validateSuccessfulLogin();
});
```

---

### 5. **tests/Stock Count/DailyShiftCount.spec.ts**
**Purpose**: Test specifications for Daily Shift Count feature

---

### 6. **fixtures/baseTest.ts**
**Purpose**: Custom test fixture providing automatic page object instantiation

**Key Feature**:
```typescript
// Automatically creates page objects - no manual instantiation needed
export const test = base.extend<CustomFixtures>({
  rtcDashboardLoginPage: async ({ page }, use) => {
    const loginPage = new RTCDashboardLoginPage(page);
    await use(loginPage);  // Test receives ready-to-use page object
  },
});
```

---

### 7. **constants/env.ts**
**Purpose**: Centralize all environment configuration

**Contains**:
- Base URL (from environment or override)
- Timeouts
- Environment name (QA/PROD)

---

### 8. **utils/helpers.ts**
**Purpose**: Reusable helper functions

**Functions**:
```typescript
- log(message)                  → Log with timestamp
- waitForTimeout(page, ms)      → Explicit pause
- waitForPageLoad(page)         → Wait for network idle
- takeScreenshot(page, name)    → Capture screenshots
```

---

## ⚙️ How the Framework Works

### Test Execution Flow

```
1. npm test (or npm run test:prod)
   ↓
2. Playwright reads playwright.config.ts
   ├─ Sets testDir: './tests'
   ├─ Sets baseURL from ENV
   ├─ Configures browsers (Chromium, Firefox, WebKit)
   └─ Enables reporters (HTML, list)
   ↓
3. Loads test files from tests/
   ↓
4. For each test file:
   ├─ Imports baseTest fixture
   ├─ Launches browser
   ├─ Creates new page context
   └─ Instantiates page objects
   ↓
5. Test execution:
   ├─ Call page object methods
   ├─ Perform actions (click, type, navigate)
   ├─ Make assertions
   └─ Capture screenshots/videos/traces
   ↓
6. Test cleanup:
   ├─ Close browser
   ├─ Generate artifacts
   └─ Collect results
   ↓
7. Generate HTML report
   ↓
8. Display report: npm run report
```

### Data Flow

```
Environment Variables
    ↓
constants/env.ts → playwright.config.ts
    ↓
baseTest.ts (fixture setup)
    ↓
Page Objects (pages/*.ts)
    ↓
Test Specifications (tests/*.spec.ts)
    ↓
HTML Report + Artifacts
```

---

## 🚀 How to Run Tests

### Quick Start Commands

```bash
# Install dependencies
npm install
npx playwright install

# Run all tests (default: QA environment, headless)
npm test

# Run tests with visible browser
npm run test:headed

# Run tests in debug mode (Playwright Inspector)
npm run test:debug

# Run tests on specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Run against PROD environment
npm run test:prod

# Run specific test file
npm run test:login

# View test report
npm run report
```

### Advanced Commands

```bash
# Run specific test by name
npx playwright test -g "should login successfully"

# Run tests in serial (one after another)
npx playwright test --workers=1

# Update snapshots
npx playwright test --update-snapshots

# List all tests without running
npx playwright test --list
```

### Environment Configuration

```bash
# Linux/Mac/WSL
ENVIRONMENT=prod npm test
ENVIRONMENT=qa npm test

# PowerShell
$env:ENVIRONMENT="prod"; npm test
```

---

## 🔧 Key Components Explained

### playwright.config.ts

```typescript
defineConfig({
  testDir: './tests',           // Where test files are located
  timeout: 30_000,              // Max time per test (30 seconds)
  fullyParallel: true,          // Run tests in parallel
  retries: 1,                   // Retry failed tests once
  
  use: {
    baseURL: ENV.BASE_URL,      // Default URL for goto()
    trace: 'on',                // Record trace for debugging
    screenshot: 'on',           // Capture screenshots
    video: 'on',                // Record videos
  },
  
  projects: [                   // Browser configurations
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  
  reporter: [['html', { outputFolder: 'playwright-report' }]],
});
```

### baseTest.ts (Custom Fixture)

```typescript
// Extends Playwright test with custom fixtures
export const test = base.extend<CustomFixtures>({
  rtcDashboardLoginPage: async ({ page }, use) => {
    const pageObj = new RTCDashboardLoginPage(page);
    await use(pageObj);
  },
});

// Usage in tests
import { test, expect } from '../fixtures/baseTest';

test('example', async ({ rtcDashboardLoginPage }) => {
  // rtcDashboardLoginPage is automatically available
});
```

### Page Object Class Structure

```typescript
export class DailyShiftCountPage {
  // 1. LOCATORS - Define UI elements
  readonly newDailyShiftCountButton: Locator;
  readonly countIdHeader: Locator;

  constructor(private page: Page) {
    // Initialize locators in constructor
    this.newDailyShiftCountButton = 
      page.locator('button:has-text("+ NEW DAILY SHIFT COUNT")');
  }

  // 2. ACTIONS - User interactions
  async clickNewCountButton(): Promise<void> {
    await this.newDailyShiftCountButton.click();
  }

  // 3. VALIDATIONS - Assertions
  async verifyPageLoaded(): Promise<void> {
    await expect(this.newDailyShiftCountButton).toBeVisible();
  }

  // 4. PRIVATE METHODS - Internal helpers
  private async verifyNewDailyShiftCountButton(): Promise<void> {
    await expect(this.newDailyShiftCountButton).toBeVisible();
  }
}
```

---

## 🎭 Demo Scenarios

### Scenario 1: Simple Login Test

```typescript
import { test, expect } from '../fixtures/baseTest';

test('User should be able to login with valid credentials', async ({ 
  rtcDashboardLoginPage 
}) => {
  // ARRANGE - Navigate to login page
  await rtcDashboardLoginPage.navigate();

  // ACT - Perform login
  await rtcDashboardLoginPage.login('admin@example.com', 'password123');

  // ASSERT - Verify successful login
  await rtcDashboardLoginPage.validateSuccessfulLogin();
});
```

**What happens behind the scenes**:
1. Playwright launches browser (Chromium, Firefox, WebKit)
2. Creates new page context
3. baseTest fixture instantiates RTCDashboardLoginPage
4. Test navigates to login page
5. Enters credentials using page object methods
6. Asserts URL changed (not on /login anymore)
7. Browser closes, screenshot/video captured

---

### Scenario 2: Daily Shift Count Landing Page Test

```typescript
import { test, expect } from '../fixtures/baseTest';
import { DailyShiftCountPage } from '../../pages/Stock Count/DailyShiftCountPage';

test('Daily Shift Count page should display all elements', async ({ page }) => {
  // Create page object instance
  const dailyShiftCountPage = new DailyShiftCountPage(page);

  // Navigate to page
  await page.goto('http://dv-backoffice.wbhq.com/counts/daily');

  // Verify elements visible
  await expect(dailyShiftCountPage.newDailyShiftCountButton).toBeVisible();
  await expect(dailyShiftCountPage.countIdHeader).toBeVisible();
  await expect(dailyShiftCountPage.nameHeader).toBeVisible();
});
```

---

### Scenario 3: Multi-Environment Test

```bash
# Run same test against different environments
npm run test:login        # Uses QA (default)
npm run test:login:prod   # Uses PROD
npm run test:login:qa     # Uses QA explicitly
```

**Behind the scenes**:
- `ENVIRONMENT` env var changes which URL is used
- No test code changes needed
- Same test validates QA and PROD

---

### Scenario 4: Parallel Execution

By default, Playwright runs tests in parallel:

```
Test A ──┐
Test B ──├─→ Runs simultaneously (3 workers by default)
Test C ──┘

Benefits:
✓ Faster execution
✓ Better resource utilization
✓ Scale with CI/CD pipelines
```

---

## 📊 Test Artifacts

After running tests, artifacts are captured:

```
playwright-report/
├── index.html              # Main HTML report
├── data/
│   └── test-results.json   # Detailed results
└── trace/                  # Debug traces

test-results/
├── chromium/               # Browser-specific results
├── firefox/
├── webkit/
├── screenshots/            # Captured images
└── videos/                 # Recorded videos
```

### View HTML Report

```bash
npm run report
# Opens interactive HTML report in default browser
```

**Report includes**:
- ✓ Pass/Fail status
- ✓ Execution time
- ✓ Screenshots & videos
- ✓ Full stack traces
- ✓ Console logs
- ✓ Network activity

---

## 📈 Best Practices

### 1. Use Page Objects for All UI Interactions
```typescript
// ✅ Good
await rtcDashboardLoginPage.login(email, password);

// ❌ Bad
await page.locator('input[name="email"]').fill(email);
```

### 2. One Test = One Scenario
```typescript
// ✅ Good - Focused test
test('should login with valid credentials', async ({ rtcDashboardLoginPage }) => {
  await rtcDashboardLoginPage.login('user@example.com', 'pass123');
  await rtcDashboardLoginPage.validateSuccessfulLogin();
});

// ❌ Bad - Multiple scenarios in one test
test('user workflow', async ({ rtcDashboardLoginPage }) => {
  // Login test
  // Wastage test
  // Logout test
});
```

### 3. Use Descriptive Test Names
```typescript
// ✅ Good
test('should display error message for invalid credentials', ...)

// ❌ Bad
test('login error', ...)
```

### 4. Leverage Private Methods for Internal Logic
```typescript
export class DailyShiftCountPage {
  // Private - used internally only
  private async verifyColumnHeaders(): Promise<void> { }

  // Public - called from tests
  async validatePageLoaded(): Promise<void> {
    await this.verifyColumnHeaders();
  }
}
```

---

## 🔍 Troubleshooting

### Tests Timing Out
```typescript
// Increase timeout in playwright.config.ts
timeout: 60_000,  // 60 seconds instead of 30

// Or per-test
test.setTimeout(60_000);
test('slow test', async () => { });
```

### Flaky Tests (Unreliable)
```typescript
// Use Playwright's auto-waiting instead of manual waits
await page.waitForTimeout(1000);  // ❌ Bad
await page.click('button');       // ✅ Good - auto-waits

// Enable retries
test.setTimeout(30_000);
test.describe.configure({ timeout: 30_000 });
```

### Debugging
```bash
# Run tests with Playwright Inspector
npm run test:debug

# Run single test in headed mode
npx playwright test --headed -g "test name"

# View trace
npx playwright show-trace path/to/trace
```

---

## ✅ Summary

| Aspect | How It Works |
|--------|-------------|
| **What** | Enterprise E2E testing framework for web apps |
| **Tools** | Playwright + TypeScript + Node.js |
| **Pattern** | Page Object Model for maintainability |
| **Structure** | pages/ (UI logic) + tests/ (test logic) |
| **Execution** | Parallel multi-browser (Chromium, Firefox, WebKit) |
| **Data** | Multi-environment (QA, PROD) |
| **Artifacts** | Screenshots, videos, traces, HTML reports |
| **Commands** | npm test, npm run test:prod, npm run report |

---

## 🎓 Learning Path

1. ✅ Read this guide
2. ✅ Review existing page objects (RTCDashboardLoginPage.ts)
3. ✅ Study existing tests (rtcDashboard-login.spec.ts)
4. ✅ Run tests: `npm test`
5. ✅ View report: `npm run report`
6. ✅ Create new page object for Daily Shift Count
7. ✅ Write tests for Daily Shift Count
8. ✅ Run in debug mode: `npm run test:debug`

---

## 📞 Quick Reference

```bash
# Setup
npm install && npx playwright install

# Run tests
npm test                          # All tests, QA
npm run test:prod                 # All tests, PROD
npm run test:headed               # With visible browser
npm run test:debug                # With Playwright Inspector
npm run test:chromium             # Chromium only

# Specific tests
npm run test:login                # Login tests only
npm run test:login:prod           # Login tests on PROD

# Reporting
npm run report                    # Open HTML report

# Utilities
npx playwright test -g "pattern"  # Run by name pattern
npx playwright test --list        # List all tests
ENVIRONMENT=prod npm test         # Set environment
```

---

**Created for**: Framework Demonstration  
**Last Updated**: 13 May 2026  
**Framework Version**: 1.0.0

