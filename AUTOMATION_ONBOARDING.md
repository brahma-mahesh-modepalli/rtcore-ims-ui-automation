# Automation Framework Onboarding

A practical guide for engineers joining the RTCore IMS UI automation team. Use [README.md](README.md) for full machine setup, database access, BrowserStack, and CI configuration.

## What This Repository Does

This is an end-to-end test framework for RTCore IMS. Tests use Playwright and TypeScript to exercise the UI, compare visible behavior with PostgreSQL data where needed, and retain screenshots, videos, and traces for debugging.

The main execution flow is:

```text
Playwright test -> shared fixtures -> test/page objects -> UI and/or TestDataRepository -> PostgreSQL
```

## First-Day Setup

1. Install Node.js 24 or later and npm.
2. Install the project dependencies and browser binaries:

   ```bash
   npm ci
   npx playwright install
   ```

3. Create `.env` from `.env.example` and obtain approved QA/database credentials from the team. Never commit `.env` or paste secrets into test files.
4. Run a focused test before attempting the full suite:

   ```bash
   npx playwright test --project=chromium --workers=1 --grep 'TC_RCSP-455_04'
   ```

For required environment values and network access prerequisites, see [README.md](README.md).

## Repository Map

| Path | Responsibility |
|---|---|
| `tests/EPIC-RCSP-*/` | Test scenarios grouped by epic/story |
| `pages/` | Page objects: locators and UI actions/assertions |
| `fixtures/baseTest.ts` | Shared `test`, `expect`, `testData`, and `activeStoreContext` fixtures |
| `test-data/` | Scenario JSON and test-case metadata |
| `utils/testData.ts` | Helpers for reading scenario/test-case JSON |
| `test-data/TestDataRepository.ts` | Typed bridge from tests to database queries |
| `database/queries/` | Domain-organized, parameterized SQL |
| `database/DBConnection.ts` | PostgreSQL pool and shared query execution |
| `config/` and `constants/` | Environment URLs and runtime configuration |
| `reporting/Reporting.ts` | Timestamped info/pass/fail/error logging |
| `test-results/` | Screenshots, videos, and traces from test runs |

## How a Test Is Structured

A spec should describe behavior and coordinate page objects; it should not duplicate locator logic or embed SQL. Existing tests use both a direct `@playwright/test` import and the custom fixture from `fixtures/baseTest.ts`; use the fixture when you need `testData` or `activeStoreContext`.

Example using the built-in active-store and database fixtures:

```typescript
import { test, expect } from '../../fixtures/baseTest';

test('vendor items match the active store order guide', async ({ activeStoreContext, testData }) => {
  const items = await testData.getActiveOrderGuideItemsByStoreAndVendorName(
    activeStoreContext.storeId,
    'Flowers Baking Company',
  );

  expect(items.length).toBeGreaterThan(0);
});
```

For tests that use explicit setup, follow nearby specs: log in with `RTCDashboardLoginPage`, switch stores with `TransfersPage`, navigate with the feature page object, and use assertion helpers instead of raw locators where available.

## Adding a Test Case

1. Confirm the workbook/requirement, target epic folder, and existing case IDs.
2. Find a neighboring spec and the owning page object. Reuse existing methods before adding new ones.
3. Put reusable UI interactions in the page object; keep test-specific orchestration and assertions in the spec.
4. For database-backed data, add a typed query to `database/queries/<Domain>Queries.ts`, export it through `DBQueries.ts`, and expose it through `TestDataRepository`. Bind inputs with `$1`, `$2`, etc.; do not concatenate values into SQL.
5. Keep workbook case IDs in test names and, when the repository uses scenario JSON, record IDs and common data in `test-data/RCSP-<id>.json`.
6. Make assumptions explicit. If QA lacks a required fixture, skip with a precise reason or annotate the coverage limitation; do not silently substitute unrelated data.
7. Run the focused spec, then type diagnostics and discovery checks. Run the full suite when the change could affect shared behavior.

## Running Tests

```bash
# One test file, Chromium only, serialized
npx playwright test --project=chromium --workers=1 tests/EPIC-RCSP-8/RCSP-455.spec.ts

# One test case by title fragment
npx playwright test --project=chromium --workers=1 --grep 'TC_RCSP-455_01'

# Discover tests without executing them
npx playwright test --list --project=chromium

# Run the complete configured suite
npm test

# Choose an environment
ENVIRONMENT=staging npx playwright test --project=chromium
ENVIRONMENT=prod npx playwright test --project=chromium

# Type-check and check current diagnostics
npx tsc --noEmit
```

The environment defaults to QA. Tests can create or submit real QA records, so check the test flow before running state-changing cases and use one worker for such runs.

## Debugging a Failure

- Start with the first failing assertion and the run output; distinguish an automation locator issue from an application/data mismatch.
- Open the matching `test-results/<test-name>/error-context.md` for the accessible page snapshot.
- Inspect `test-failed-1.png` and `trace.zip` to see the UI at failure time and the actions leading to it.
- Run one test with `--workers=1 --retries=0` while diagnosing; retries can hide intermittent behavior.
- Check current QA data through `testData` before hardcoding assumptions. Store/vendor mappings and test data can differ by environment.
- Use `Reporting.info` for concise diagnostic context. Never log passwords, access tokens, cookies, or connection strings.

## Conventions and Safety

- Prefer accessible locators (`getByRole`, `getByLabel`, `getByPlaceholder`) and stable page-object methods.
- Do not use fixed sleeps to mask races when an assertion or state wait can express readiness.
- Keep SQL read-only for ordinary test setup. Any test that creates, edits, deletes, or submits business records needs an explicit cleanup/impact plan.
- Do not assert hardcoded PO IDs, dates, or dynamic item lists. Read runtime values from the database or response when the scenario requires them.
- Never commit credentials or real secrets. Do not log token values or full response bodies that may contain sensitive data.
- Keep changes focused; do not reformat unrelated files.

## Useful References

- [README.md](README.md): machine setup, DB configuration, CI, BrowserStack
- [FRAMEWORK_DEMO.md](FRAMEWORK_DEMO.md): broader framework walkthrough
- [playwright.config.ts](playwright.config.ts): local timeout, projects, artifacts, and workers
- [fixtures/baseTest.ts](fixtures/baseTest.ts): available custom fixtures
- [database/DBConnection.ts](database/DBConnection.ts): shared DB execution and logging
