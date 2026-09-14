/**
 * RCSP-134 – Inventory - Vendor Items: DB vs UI Price validation
 * Test case IDs: TC_RCSP-134_01 … TC_RCSP-134_09.
 *
 * Under WB Unit 1034, searches the Vendor Items UI by i.sku and compares the
 * displayed Price against PostgreSQL vi.unit_cost for Vendor ID 2 (all
 * records) and Vendor ID 3 (latest applicable record per item_id).
 */

import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { VendorItemsPage } from '../../pages/Inventory/VendorItemsPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';
import type { VendorItemData } from '../../test-data/TestDataRepository';

const RCSP_134_FILE_NAME = 'RCSP-134';
const RCSP_134_SCENARIO_ID = 'RCSP-134';

const TC = {
  matchAllVendor2: 'TC_RCSP-134_01',
  noMissingVendor2: 'TC_RCSP-134_02',
  latestMatchVendor3: 'TC_RCSP-134_03',
  latestSelectedOnDuplicate: 'TC_RCSP-134_04',
  excludeNullDates: 'TC_RCSP-134_05',
  priceVendor2: 'TC_RCSP-134_06',
  searchReturnsCorrectSku: 'TC_RCSP-134_07',
  priceLatestVendor3: 'TC_RCSP-134_08',
  allSkusLatestVendor3: 'TC_RCSP-134_09',
} as const;

function getCaseData<T>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_134_FILE_NAME,
    RCSP_134_SCENARIO_ID,
    testCaseId,
  );
}

function getHierarchy(): { region: string; market: string; store: string } {
  return getScenarioTestData<{ commonData: { hierarchy: { region: string; market: string; store: string } } }>(
    RCSP_134_FILE_NAME,
    RCSP_134_SCENARIO_ID,
  ).commonData.hierarchy;
}

async function assertPriceMatches(
  vendorItemsPage: VendorItemsPage,
  record: VendorItemData,
): Promise<void> {
  await vendorItemsPage.searchBySku(record.sku);
  await vendorItemsPage.verifySearchReturnedSku(record.sku, record.vendor_sku);
  const uiPrice = await vendorItemsPage.getPriceForSku(record.sku, record.vendor_sku);

  expect(
    vendorItemsPage.normalizePrice(uiPrice),
    `Price mismatch for SKU ${record.sku} (vendor SKU ${record.vendor_sku}): DB unit_cost=${record.unit_cost} UI Price=${uiPrice}`,
  ).toBeCloseTo(Number.parseFloat(record.unit_cost), 2);
}

test.describe('RCSP-134 - Vendor Items DB vs UI Price validation', () => {
  test.setTimeout(180000);

  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;
  let vendorItemsPage: VendorItemsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new RTCDashboardLoginPage(page);
    transfersPage = new TransfersPage(page);
    vendorItemsPage = new VendorItemsPage(page);

    log('Launching URL: ' + CONFIG.dashboardURL);
    await page.goto(CONFIG.dashboardURL);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
    log('✓ Login successful');

    const hierarchy = getHierarchy();
    await transfersPage.switchStore(hierarchy.region, hierarchy.market, hierarchy.store);
    await vendorItemsPage.navigateToVendorItems();
  });

  test('TC_RCSP-134_01 – Price for searched SKU matches DB unit_cost for Vendor ID 2', { tag: ['@smoke', '@sanity', '@functional'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.matchAllVendor2);
    const dbRecords = await testData.getVendorItemsByVendorId(vendorId);
    expect(dbRecords.length).toBeGreaterThan(0);

    for (const record of dbRecords) {
      await assertPriceMatches(vendorItemsPage, record);
    }
  });

  test('TC_RCSP-134_02 – All database SKUs for Vendor ID 2 can be searched and validated in the UI', { tag: ['@functional'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.noMissingVendor2);
    const dbRecords = await testData.getVendorItemsByVendorId(vendorId);
    expect(dbRecords.length).toBeGreaterThan(0);

    for (const record of dbRecords) {
      await assertPriceMatches(vendorItemsPage, record);
    }
  });

  test('TC_RCSP-134_03 – Price for searched SKU matches the latest DB unit_cost for Vendor ID 3', { tag: ['@functional'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.latestMatchVendor3);
    const latestRecords = await testData.getLatestVendorItemsByVendorId(vendorId);
    expect(latestRecords.length).toBeGreaterThan(0);

    for (const record of latestRecords) {
      await assertPriceMatches(vendorItemsPage, record);
    }
  });

  test('TC_RCSP-134_04 – Latest vendor item Price is displayed when duplicates exist for Vendor ID 3', { tag: ['@regression'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.latestSelectedOnDuplicate);
    const allRecords = await testData.getVendorItemsByVendorId(vendorId);
    const latestRecords = await testData.getLatestVendorItemsByVendorId(vendorId);

    const countsByItem = new Map<number, number>();
    for (const record of allRecords) {
      countsByItem.set(record.item_id, (countsByItem.get(record.item_id) ?? 0) + 1);
    }
    const duplicateItemIds = [...countsByItem.entries()]
      .filter(([, count]) => count > 1)
      .map(([itemId]) => itemId);

    test.skip(
      duplicateItemIds.length === 0,
      'No item_id with multiple vendor_item records found for Vendor ID 3 in the current environment',
    );

    for (const itemId of duplicateItemIds) {
      const latest = latestRecords.find((record) => record.item_id === itemId);
      expect(latest, `Expected a latest record for item_id ${itemId}`).toBeDefined();
      if (!latest) continue;

      await assertPriceMatches(vendorItemsPage, latest);
    }
  });

  test('TC_RCSP-134_05 – Records with null available_from/expires_at are excluded from Vendor ID 3 Price validation', { tag: ['@regression'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.excludeNullDates);
    const allRecords = await testData.getVendorItemsByVendorId(vendorId);
    const latestRecords = await testData.getLatestVendorItemsByVendorId(vendorId);

    const nullDateRecords = allRecords.filter(
      (record) => !record.available_from || !record.expires_at,
    );
    for (const nullRecord of nullDateRecords) {
      const stillPresent = latestRecords.some(
        (latest) => latest.vendor_item_id === nullRecord.vendor_item_id,
      );
      expect(
        stillPresent,
        `vendor_item_id ${nullRecord.vendor_item_id} has null available_from/expires_at and must be excluded`,
      ).toBeFalsy();
    }

    for (const record of latestRecords) {
      expect(record.available_from, `available_from should not be null for vendor_item_id ${record.vendor_item_id}`).toBeTruthy();
      expect(record.expires_at, `expires_at should not be null for vendor_item_id ${record.vendor_item_id}`).toBeTruthy();
      await assertPriceMatches(vendorItemsPage, record);
    }
  });

  test('TC_RCSP-134_06 – Price displayed for every Vendor ID 2 SKU matches the corresponding DB unit_cost', { tag: ['@functional'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.priceVendor2);
    const dbRecords = await testData.getVendorItemsByVendorId(vendorId);
    expect(dbRecords.length).toBeGreaterThan(0);

    for (const record of dbRecords) {
      await assertPriceMatches(vendorItemsPage, record);
    }
  });

  test('TC_RCSP-134_07 – Vendor ID 2 SKU search returns the correct vendor item before Price validation', { tag: ['@functional'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.searchReturnsCorrectSku);
    const dbRecords = await testData.getVendorItemsByVendorId(vendorId);
    expect(dbRecords.length).toBeGreaterThan(0);

    for (const record of dbRecords) {
      await vendorItemsPage.searchBySku(record.sku);
      await vendorItemsPage.verifySearchReturnedSku(record.sku, record.vendor_sku);
      const uiPrice = await vendorItemsPage.getPriceForSku(record.sku, record.vendor_sku);
      expect(
        vendorItemsPage.normalizePrice(uiPrice),
        `Price mismatch for SKU ${record.sku} (vendor SKU ${record.vendor_sku}): DB unit_cost=${record.unit_cost} UI Price=${uiPrice}`,
      ).toBeCloseTo(Number.parseFloat(record.unit_cost), 2);
    }
  });

  test('TC_RCSP-134_08 – Price displayed for the latest Vendor ID 3 record matches the DB unit_cost', { tag: ['@functional'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.priceLatestVendor3);
    const latestRecords = await testData.getLatestVendorItemsByVendorId(vendorId);
    expect(latestRecords.length).toBeGreaterThan(0);

    for (const record of latestRecords) {
      await assertPriceMatches(vendorItemsPage, record);
    }
  });

  test('TC_RCSP-134_09 – All Vendor ID 3 SKUs are searched and their Price validated against the latest DB unit_cost', { tag: ['@functional'] }, async ({
    testData,
  }) => {
    const { vendorId } = getCaseData<{ vendorId: number }>(TC.allSkusLatestVendor3);
    const latestRecords = await testData.getLatestVendorItemsByVendorId(vendorId);
    expect(latestRecords.length).toBeGreaterThan(0);

    const mismatches: string[] = [];
    for (const record of latestRecords) {
      await vendorItemsPage.searchBySku(record.sku);
      await vendorItemsPage.verifySearchReturnedSku(record.sku, record.vendor_sku);
      const uiPrice = await vendorItemsPage.getPriceForSku(record.sku, record.vendor_sku);
      const normalizedUiPrice = vendorItemsPage.normalizePrice(uiPrice);
      const dbPrice = Number.parseFloat(record.unit_cost);
      if (Math.abs(normalizedUiPrice - dbPrice) > 0.01) {
        mismatches.push(`SKU ${record.sku}: DB=${dbPrice} UI=${normalizedUiPrice}`);
      }
    }

    expect(mismatches, `Price mismatches found: ${JSON.stringify(mismatches)}`).toEqual([]);
  });
});
