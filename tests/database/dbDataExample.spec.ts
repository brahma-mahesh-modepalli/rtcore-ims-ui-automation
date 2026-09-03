/**
 * POC: Retrieve test data from PostgreSQL
 * =======================================
 * Demonstrates the new DB-based test-data path without touching any existing
 * JSON-based tests:
 *
 *   Playwright Test -> TestDataRepository -> DBQueries -> DBConnection -> PostgreSQL
 *
 * Uses SELECT only. Requires a valid .env (see .env.example) with the Stage
 * PostgreSQL credentials for the current machine to reach the DB.
 */

import { test, expect } from '../../fixtures/baseTest';

test('Get test data from PostgreSQL', async ({ testData }) => {
  const store = await testData.getStoreById(1034);

  expect(store).toBeDefined();
  console.log('Store ID:', store?.store_id);
  console.log('Store Name:', store?.name);
});
