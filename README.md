# RTCore IMS UI Automation

Playwright and TypeScript end-to-end automation for the RTCore IMS application. The framework uses Page Object Model classes, supports QA/Staging/Production environments, reads PostgreSQL data for DB-backed tests, and can run on BrowserStack.

## Prerequisites

- Node.js 24 or later
- npm and Git
- Access to the target application environment
- PostgreSQL Stage access for DB-backed tests
- BrowserStack account and Automate credentials for remote execution

Check versions:

```bash
node --version
npm --version
```

## First-Time Setup

```bash
git clone https://github.com/brahma-mahesh-modepalli/rtcore-ims-ui-automation.git
cd rtcore-ims-ui-automation
npm ci
npx playwright install
cp .env.example .env
```

Fill in `.env` locally. It is gitignored and must never be committed.

For Linux CI machines, install browser dependencies with:

```bash
npx playwright install --with-deps
```

## Environment Configuration

Select the application environment with `ENVIRONMENT`:

```bash
# QA is the default
npm test

# Staging
ENVIRONMENT=staging npm test

# Production
ENVIRONMENT=prod npm test
```

Environment-specific configuration is in `config/` and `constants/`. Never hardcode passwords or access keys in test files.

## Local Test Commands

```bash
# Complete local suite
npm test

# Visible browser
npm run test:headed

# Playwright debugger
npm run test:debug

# One browser project
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Specific test file
npm test -- tests/EPIC-RCSP-139/RCSP-31.spec.ts

# Tests matching a title pattern
npm test -- -g "Draft"

# Open the HTML report
npm run report
```

The local config is [playwright.config.ts](playwright.config.ts). Generated output is stored in `test-results/` and `playwright-report/`.

## Database-Backed Tests

PostgreSQL access uses `pg` and a shared pool:

```text
Test -> TestDataRepository -> domain query file -> DBConnection -> PostgreSQL
```

Add these settings to `.env`:

```dotenv
DB_HOST=your-stage-db-host
DB_PORT=5432
DB_NAME=whataburger_ims
DB_USER=your-stage-db-username
DB_PASSWORD=your-stage-db-password
DB_SSL=true
```

Queries are grouped under `database/queries/`:

```text
database/
├── DBConnection.ts
└── queries/
    ├── InventoryQueries.ts
    ├── OrderingQueries.ts
    ├── RecipeQueries.ts
    ├── StoreQueries.ts
    ├── TransferQueries.ts
    ├── UomQueries.ts
    ├── UserQueries.ts
    └── WastageQueries.ts
```

Use `TestDataRepository` from tests. Keep SQL in the domain query files and use parameterized values.

Example:

```typescript
const item = await repository.getTransferableZeroStockIngredientByStoreId(37);
await transfersPage.addItem(item!.name, '1.1', item!.sku);
```

Run the read-only DB proof-of-connection test:

```bash
npx playwright test tests/database/dbDataExample.spec.ts --project=chromium
```

Legacy tests may still use JSON files in `test-data/`. DB-backed tests should use `TestDataRepository` and must not add SQL directly to spec files.

## BrowserStack Execution

BrowserStack uses [browserstack.config.ts](browserstack.config.ts). BrowserStack Local is enabled by default so private QA URLs can be reached.

Add these values to local `.env`:

```dotenv
BROWSERSTACK_USERNAME=your-browserstack-username
BROWSERSTACK_ACCESS_KEY=your-browserstack-access-key
BROWSERSTACK_PROJECT_NAME=RTCore IMS UI Automation
BROWSERSTACK_BUILD_NAME=rtcore-ims-ui-automation - feature/inventory-tests
BROWSERSTACK_LOCAL=true
BROWSERSTACK_LOCAL_IDENTIFIER=rtcore-ims-ui-automation-local
```

Run remotely:

```bash
npm run test:browserstack
npm run test:browserstack:rcsp31
npm run test:browserstack:rcsp707
```

The GitHub Actions workflow is [.github/workflows/browserstack.yml](.github/workflows/browserstack.yml). It runs on pushes to `feature/inventory-tests` and can also be started manually.

Add these **repository secrets** in GitHub under **Settings -> Secrets and variables -> Actions**:

```text
BROWSERSTACK_USERNAME
BROWSERSTACK_ACCESS_KEY
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

Use `5432` for `DB_PORT` and `whataburger_ims` for `DB_NAME`. Never commit BrowserStack keys or database passwords. The workflow uses Node 24 and validates required secrets before running tests.

## Project Structure

```text
config/             Application environment configuration
constants/          Environment resolution and constants
database/           PostgreSQL connection and query files
fixtures/           Shared Playwright fixtures
pages/              Page Object Model classes
reporting/          Reporting utility
test-data/          Existing JSON data for legacy tests
tests/              Playwright specifications
utils/              Shared helpers and data utilities
playwright.config.ts Local Playwright configuration
browserstack.config.ts BrowserStack configuration
package.json        Scripts and dependencies
```

## Adding or Updating Tests

1. Place a spec under the appropriate `tests/EPIC-*` folder.
2. Reuse or extend the relevant page object under `pages/`.
3. Keep locators and UI actions in page objects, not in specs.
4. Use `TestDataRepository` for data that belongs in PostgreSQL.
5. Use JSON helpers only for legacy scenarios that still depend on JSON data.
6. Keep DB operations read-only unless a controlled state change is explicitly required.
7. Run the focused spec before the full suite.

Example:

```typescript
import { test, expect } from '@playwright/test';
import { TestDataRepository } from '../../test-data/TestDataRepository';

const repository = new TestDataRepository();

test('uses runtime database data', async ({ page }) => {
  const item = await repository.getTransferableZeroStockIngredientByStoreId(37);
  expect(item).toBeDefined();
  // Pass item.sku to a page-object method.
});
```

## Reports and Troubleshooting

```bash
# Open the local report
npm run report

# Run one test visibly
npm test -- tests/path/example.spec.ts --headed

# Remove generated artifacts
rm -rf test-results playwright-report playwright-report-browserstack

# Check test discovery
npx playwright test --list --project=chromium

# Check TypeScript
npx tsc --noEmit
```

Common issues:

- **Missing DB configuration:** verify all `DB_*` values exist in `.env`.
- **`no pg_hba.conf entry` or `no encryption`:** use `DB_SSL=true`.
- **BrowserStack exit code 1:** verify all seven GitHub repository secrets exist; the workflow prints missing secret names without printing values.
- **Private QA URL unreachable on BrowserStack:** keep `BROWSERSTACK_LOCAL=true` and verify the Local tunnel starts.
- **Browser launch failure:** run `npx playwright install --with-deps` on Linux.

## Git Workflow

The BrowserStack workflow is configured for `feature/inventory-tests`:

```bash
git status
git diff --check
npm ci
npx playwright test --list --project=chromium
git add <files>
git commit -m "describe the change"
git push origin feature/inventory-tests
```

Do not commit `.env`, credentials, `node_modules/`, Playwright reports, or test results.

## Useful Links

- [Playwright](https://playwright.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [BrowserStack Automate](https://automate.browserstack.com/overview)
- [GitHub Actions secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
