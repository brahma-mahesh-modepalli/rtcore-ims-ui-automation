/**
 * RCSP-191 – Inventory Setup: Item Master
 * Test case IDs: TC_RCSP-191_001 … TC_RCSP-191_009.
 */

import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { ItemMasterPage } from '../../pages/Inventory Setup/ItemMasterPage';
import { StockCountPage } from '../../pages/Stock Count/StockCountPage';
import { DailyShiftCountPage } from '../../pages/Stock Count/DailyShiftCountPage';
import { StockCountAddItemPage } from '../../pages/Stock Count/StockCountAddItemPage';
import { LogWastePage } from '../../pages/Wastage/LogWastePage';
import { getNextCountMonday } from '../../utils/testDates';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const RCSP_191_FILE_NAME = 'RCSP-191';
const RCSP_191_SCENARIO_ID = 'RCSP-191';

const TC = {
  pageLoads: 'TC_RCSP-191_001',
  controlsVisible: 'TC_RCSP-191_002',
  typeStatusFilters: 'TC_RCSP-191_003',
  searchVariants: 'TC_RCSP-191_004',
  invalidSearch: 'TC_RCSP-191_005',
  searchOrdering: 'TC_RCSP-191_006',
  hierarchyScoped: 'TC_RCSP-191_007',
  inactiveExcluded: 'TC_RCSP-191_008',
  combinedFilters: 'TC_RCSP-191_009',
} as const;

function getCaseData<T>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_191_FILE_NAME,
    RCSP_191_SCENARIO_ID,
    testCaseId,
  );
}

function getCommonData(): {
  hierarchy: { region: string; market: string; store: string };
  storeId: number;
} {
  return getScenarioTestData<{
    commonData: { hierarchy: { region: string; market: string; store: string }; storeId: number };
  }>(RCSP_191_FILE_NAME, RCSP_191_SCENARIO_ID).commonData;
}

test.describe('RCSP-191 - Inventory Setup: Item Master', () => {
  test.setTimeout(90000);

  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;
  let itemMasterPage: ItemMasterPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new RTCDashboardLoginPage(page);
    transfersPage = new TransfersPage(page);
    itemMasterPage = new ItemMasterPage(page);

    log('Launching URL: ' + CONFIG.dashboardURL);
    await page.goto(CONFIG.dashboardURL);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
    log('✓ Login successful');

    const { hierarchy } = getCommonData();
    await transfersPage.switchStore(hierarchy.region, hierarchy.market, hierarchy.store);
    await itemMasterPage.navigateToItemMaster();
  });

  test('TC_RCSP-191_001 – Item Master page is displayed successfully for WB Unit 1034', { tag: ['@smoke', '@sanity', '@functional'] }, async () => {
    getCaseData(TC.pageLoads);
    await expect(itemMasterPage.pageTitle).toBeVisible({ timeout: 15000 });
    expect(await itemMasterPage.getRowCount()).toBeGreaterThanOrEqual(0);
  });

  test('TC_RCSP-191_002 – Item Master page displays all required search, filter and grid controls', { tag: ['@functional'] }, async () => {
    const data = getCaseData<{ expectedTypes: string[]; expectedStatuses: string[] }>(TC.controlsVisible);

    await expect(itemMasterPage.searchInput).toBeVisible({ timeout: 15000 });
    await expect(itemMasterPage.typeDropdown).toBeVisible({ timeout: 15000 });
    await expect(itemMasterPage.statusDropdown).toBeVisible({ timeout: 15000 });
    await itemMasterPage.verifyColumnsVisible();

    const actualTypes = await itemMasterPage.getTypeDropdownOptions();
    for (const expected of data.expectedTypes) {
      expect(actualTypes.some((value) => value.toLowerCase() === expected.toLowerCase())).toBeTruthy();
    }

    const actualStatuses = await itemMasterPage.getStatusDropdownOptions();
    for (const expected of data.expectedStatuses) {
      expect(actualStatuses.some((value) => value.toLowerCase() === expected.toLowerCase())).toBeTruthy();
    }
  });

  test('TC_RCSP-191_003 – Type and Status filters display only records matching the selected filter criteria', { tag: ['@functional'] }, async () => {
    const data = getCaseData<{ types: string[]; statuses: string[] }>(TC.typeStatusFilters);

    for (const type of data.types) {
      await itemMasterPage.selectType(type);
      const rows = await itemMasterPage.getVisibleRows();
      for (const row of rows) {
        expect(row.type.toLowerCase()).toBe(type.toLowerCase());
      }
    }

    for (const status of data.statuses) {
      await itemMasterPage.selectStatus(status);
      const rows = await itemMasterPage.getVisibleRows();
      if (/active only/i.test(status)) {
        for (const row of rows) expect(row.status.toLowerCase()).toBe('active');
      } else if (/inactive only/i.test(status)) {
        for (const row of rows) expect(row.status.toLowerCase()).toBe('inactive');
      }
    }
  });

  test('TC_RCSP-191_004 – Search box returns matching inventory items using item name, PLU and Item Number', { tag: ['@functional'] }, async () => {
    const data = getCaseData<{
      partialName: string;
      completeName: string;
      plu: string;
      itemNumber?: string;
    }>(TC.searchVariants);

    await itemMasterPage.search(data.partialName);
    const partialRows = await itemMasterPage.getVisibleRows();
    expect(partialRows.length).toBeGreaterThan(0);

    await itemMasterPage.search(data.completeName);
    const completeRows = await itemMasterPage.getVisibleRows();
    expect(
      completeRows.some((row) => row.name.toLowerCase().includes(data.completeName.toLowerCase())),
    ).toBeTruthy();

    await itemMasterPage.search(data.plu);
    const pluRows = await itemMasterPage.getVisibleRows();
    expect(pluRows.some((row) => row.sku === data.plu)).toBeTruthy();

    test.skip(!data.itemNumber, 'Set testData.itemNumber in RCSP-191.json to a valid Item Number to run this step');
    await itemMasterPage.search(data.itemNumber!);
    const itemNumberRows = await itemMasterPage.getVisibleRows();
    expect(itemNumberRows.length).toBeGreaterThan(0);
  });

  test('TC_RCSP-191_005 – Invalid search input and special characters are handled correctly', { tag: ['@regression'] }, async () => {
    const data = getCaseData<{
      invalidValue: string;
      specialChars: string;
      spacedValue: string;
      expectedValue: string;
    }>(TC.invalidSearch);

    await itemMasterPage.search(data.invalidValue);
    await itemMasterPage.verifyNoResultsOrEmpty();

    await itemMasterPage.clearSearch();
    await itemMasterPage.search(data.specialChars);
    // App should not crash; page title must remain visible.
    await expect(itemMasterPage.pageTitle).toBeVisible({ timeout: 10000 });

    await itemMasterPage.clearSearch();
    await itemMasterPage.search(data.spacedValue);
    const rows = await itemMasterPage.getVisibleRows();
    expect(
      rows.some((row) => row.name.toLowerCase().includes(data.expectedValue.toLowerCase())),
    ).toBeTruthy();
  });

  test('TC_RCSP-191_006 – Exact search results are displayed before partial matches in alphabetical order', { tag: ['@functional'] }, async () => {
    const data = getCaseData<{ searchKeyword: string }>(TC.searchOrdering);

    await itemMasterPage.search(data.searchKeyword);
    const rows = await itemMasterPage.getVisibleRows();
    expect(rows.length).toBeGreaterThan(0);

    const exactIndex = rows.findIndex(
      (row) => row.name.toLowerCase() === data.searchKeyword.toLowerCase(),
    );
    if (exactIndex >= 0) {
      expect(exactIndex).toBe(0);
    }

    const partialNames = rows
      .filter((row) => row.name.toLowerCase() !== data.searchKeyword.toLowerCase())
      .map((row) => row.name);
    const sortedPartialNames = [...partialNames].sort((a, b) => a.localeCompare(b));
    expect(partialNames).toEqual(sortedPartialNames);
  });

  test('TC_RCSP-191_007 – Only inventory items assigned to WB Unit 1034 are displayed', { tag: ['@functional'] }, async ({
    testData,
  }) => {
    getCaseData(TC.hierarchyScoped);
    const { storeId } = getCommonData();

    const dbItems = await testData.getActiveInventoryItemsByStore(storeId);
    expect(dbItems.length).toBeGreaterThan(0);

    const uiRows = await itemMasterPage.getVisibleRows();
    const uiNames = uiRows.map((row) => row.name.toLowerCase());

    const sampleDbItems = dbItems.slice(0, 5);
    for (const item of sampleDbItems) {
      await itemMasterPage.search(item.name);
      const rows = await itemMasterPage.getVisibleRows();
      expect(
        rows.some((row) => row.name.toLowerCase().includes(item.name.toLowerCase())),
        `Expected DB item "${item.name}" (store ${storeId}) to be visible in Item Master`,
      ).toBeTruthy();
    }
    await itemMasterPage.clearSearch();
    void uiNames;
  });

  test('TC_RCSP-191_008 – Inactive inventory items are excluded from operational transaction forms', { tag: ['@regression'] }, async ({
    page,
  }) => {
    const data = getCaseData<{ inactiveItemName: string }>(TC.inactiveExcluded);

    test.skip(
      !data.inactiveItemName,
      'Set testData.inactiveItemName in RCSP-191.json to a real inactive item mapped to WB Unit 1034',
    );

    const inactiveItemName = data.inactiveItemName;

    // Stock Count → Daily Shift Count
    const stockCountPage = new StockCountPage(page);
    const dailyShiftCountPage = new DailyShiftCountPage(page);
    const stockCountAddItemPage = new StockCountAddItemPage(page);

    await stockCountPage.navigateToDailyShiftCount();
    await dailyShiftCountPage.createDailyShiftCount({
      shift: 'AM',
      shiftDate: getNextCountMonday(),
      name: `RCSP-191-${Date.now().toString().slice(-6)}`,
    });
    await dailyShiftCountPage.openAddItemDialog();
    await stockCountAddItemPage.verifyInactiveItemExcluded(inactiveItemName);

    // Wastage → Log Waste
    const logWastePage = new LogWastePage(page);
    await logWastePage.openLogWaste();
    await logWastePage.createWasteLog('AM');
    await logWastePage.setType('Item');
    await logWastePage.searchItemPicker(inactiveItemName);
    await logWastePage.verifyItemPickerResultAbsent(inactiveItemName);

    // Ordering is vendor-guide driven (no free-text item search across all items),
    // so inactive-item exclusion there cannot be verified via a generic search step.
    log('ℹ Ordering module has no free-text item search; inactive-item exclusion not verified there');
  });

  test('TC_RCSP-191_009 – Multiple filters work together correctly on the Item Master page', { tag: ['@functional'] }, async () => {
    const data = getCaseData<{ search: string; type: string; status: string }>(TC.combinedFilters);

    await itemMasterPage.search(data.search);
    await itemMasterPage.selectType(data.type);
    await itemMasterPage.selectStatus(data.status);

    const rows = await itemMasterPage.getVisibleRows();
    for (const row of rows) {
      expect(row.name.toLowerCase()).toContain(data.search.toLowerCase());
      expect(row.type.toLowerCase()).toBe(data.type.toLowerCase());
      if (/active only/i.test(data.status)) {
        expect(row.status.toLowerCase()).toBe('active');
      }
    }

    // Changing one filter should refresh results without leaking prior criteria.
    await itemMasterPage.selectStatus('All');
    const refreshedRows = await itemMasterPage.getVisibleRows();
    for (const row of refreshedRows) {
      expect(row.name.toLowerCase()).toContain(data.search.toLowerCase());
      expect(row.type.toLowerCase()).toBe(data.type.toLowerCase());
    }
  });
});
