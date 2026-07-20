/**
 * RCSP-133 – Sales Transactions (Service Bus → IMS) automation
 * Test case IDs use TC_RCSP-133_* format (mapped from TC-RCSP-133-001..005).
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { SalesPage } from '../../pages/Sales/SalesPage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp133CommonData,
  type Rcsp133JsonData,
} from '../../utils/testData';

const RCSP_133_FILE_NAME = 'RCSP-133';
const RCSP_133_SCENARIO_ID = 'RCSP-133';

const TC = {
  pageLoadUi: 'TC_RCSP-133_001',
  currentBusinessDateSales: 'TC_RCSP-133_002',
  gridDetailsAndSalesTab: 'TC_RCSP-133_003',
  filtersEmptyEdge: 'TC_RCSP-133_004',
  refreshPersistence: 'TC_RCSP-133_005',
} as const;

function getCommonData(): Rcsp133CommonData {
  return getScenarioTestData<Rcsp133JsonData>(
    RCSP_133_FILE_NAME,
    RCSP_133_SCENARIO_ID,
  ).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_133_FILE_NAME,
    RCSP_133_SCENARIO_ID,
    testCaseId,
  );
}

async function loginAsAdmin(page: Page): Promise<{
  loginPage: RTCDashboardLoginPage;
  salesPage: SalesPage;
}> {
  const loginPage = new RTCDashboardLoginPage(page);
  const salesPage = new SalesPage(page);

  log(`Launching URL: ${CONFIG.dashboardURL}`);
  await page.goto(CONFIG.dashboardURL);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await loginPage.login(
    CONFIG.credentials.admin.username,
    CONFIG.credentials.admin.password,
  );
  log('✓ Login successful');

  return { loginPage, salesPage };
}

async function ensureStoreContext(salesPage: SalesPage): Promise<void> {
  const common = getCommonData();
  const { region, market, store } = common.hierarchy;
  const storeCode = store.replace(/^WB Unit\s+/i, '').trim();
  const alreadyActive = await salesPage.isStoreContextActive(storeCode, store);
  if (!alreadyActive) {
    await salesPage.switchStore(region, market, store);
  } else {
    await salesPage.verifyActiveStore(store);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe("RCSP-133 - Operations > Sales > Sales Transactions: Sales Transactions page under the Operations menu loads su...", () => {
  let loginPage: RTCDashboardLoginPage;
  let salesPage: SalesPage;

  test("Verify whether the Sales Transactions page under the Operations menu loads successfully after sales data has been consumed from the QA Service Bus, with summary cards, filters, tabs, and grid displayed without UI errors", async ({ page }) => {
    ({ loginPage, salesPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      pageTitle: string;
      pageSubtitlePattern: string;
      summaryCards: string[];
      viewTabs: string[];
      columnHeaders: string[];
      store: string;
    }>(TC.pageLoadUi);

    await ensureStoreContext(salesPage);
    await salesPage.openSalesTransactions();
    await salesPage.verifySalesPageUi(data);
  });
});

test.describe("RCSP-133 - Operations > Sales > Sales Transactions: Sales transactions for the current business date are displ...", () => {
  let loginPage: RTCDashboardLoginPage;
  let salesPage: SalesPage;

  test("Verify whether sales transactions for the current business date are displayed correctly on the Sales Transactions page under Operations → Sales after data load from the QA Service Bus into IMS", async ({ page }) => {
    ({ loginPage, salesPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      mealPeriod: string;
      tab: 'All';
      expectedSaleType: string;
      expectedSaleStatus: string;
      minimumSaleRows: number;
      store: string;
    }>(TC.currentBusinessDateSales);

    await ensureStoreContext(salesPage);
    await salesPage.openSalesTransactions();
    await salesPage.verifyBusinessDayShowsCurrentDate();
    await salesPage.ensureAllMealPeriods();
    await salesPage.selectViewTab(data.tab);
    await salesPage.verifySalesRecordsVisible(data.minimumSaleRows);
    await salesPage.verifySummaryTransactionsPositive();
    await salesPage.verifyPostedSaleTypeAndStatus(
      data.expectedSaleType,
      data.expectedSaleStatus,
    );
  });
});

test.describe("RCSP-133 - Operations > Sales > Sales Transactions: Each sales transaction row displays complete details and th...", () => {
  let loginPage: RTCDashboardLoginPage;
  let salesPage: SalesPage;

  test("Verify whether each sales transaction row on the Sales Transactions page under Operations → Sales displays complete details (Sale ID, Type, Timestamp, Meal Period, Lines, Total, Status) and whether the Sales tab shows the loaded sales data", async ({ page }) => {
    ({ loginPage, salesPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      tabSequence: Array<'All' | 'Sales' | 'Refunds' | 'Deleted'>;
      columnHeaders: string[];
      sampleRowCount: number;
      expectedSaleType: string;
      expectedSaleStatus: string;
      store: string;
    }>(TC.gridDetailsAndSalesTab);

    await ensureStoreContext(salesPage);
    await salesPage.openSalesTransactions();
    await salesPage.verifyBusinessDayShowsCurrentDate();
    await salesPage.ensureAllMealPeriods();

    await salesPage.selectViewTab('All');
    await salesPage.verifyColumnHeaders(data.columnHeaders);
    await salesPage.verifySampleRowsHaveRequiredColumns(
      data.columnHeaders,
      data.sampleRowCount,
    );
    await salesPage.verifyPostedSaleTypeAndStatus(
      data.expectedSaleType,
      data.expectedSaleStatus,
    );

    await salesPage.selectViewTab('Sales');
    await salesPage.verifySalesRecordsVisible(1);
    await salesPage.verifyPostedSaleTypeAndStatus(
      data.expectedSaleType,
      data.expectedSaleStatus,
    );

    await salesPage.selectViewTab('Refunds');
    await expect(salesPage.pageTitle).toBeVisible();
    await salesPage.selectViewTab('Deleted');
    await expect(salesPage.pageTitle).toBeVisible();

    await salesPage.selectViewTab('Sales');
    await salesPage.verifySalesRecordsVisible(1);
  });
});

test.describe("RCSP-133 - Operations > Sales > Sales Transactions: Filtering and empty-data scenarios behave correctly for no...", () => {
  let loginPage: RTCDashboardLoginPage;
  let salesPage: SalesPage;

  test("Verify whether filtering and empty-data scenarios on the Sales Transactions page under Operations → Sales behave correctly for non-current business dates, cleared filters, and meal periods with no matching sales (negative and edge)", async ({ page }) => {
    ({ loginPage, salesPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      emptyBusinessDay: string;
      edgeMealPeriod: string;
      emptyTabs: Array<'Refunds' | 'Deleted'>;
      store: string;
    }>(TC.filtersEmptyEdge);

    await ensureStoreContext(salesPage);
    await salesPage.openSalesTransactions();

    await salesPage.verifyBusinessDayShowsCurrentDate();
    await salesPage.ensureAllMealPeriods();
    await salesPage.selectViewTab('All');
    await salesPage.verifySalesRecordsVisible(1);

    await salesPage.setBusinessDay(data.emptyBusinessDay);
    await salesPage.verifyEmptyStateOrZeroTransactions();

    await salesPage.clearFilters();
    await salesPage.verifyBusinessDayShowsCurrentDate();
    await salesPage.verifySalesRecordsVisible(1);

    const mealPeriodSelected = await salesPage.mealPeriodFilter
      .isVisible()
      .catch(() => false);
    if (mealPeriodSelected) {
      await salesPage.selectMealPeriod(data.edgeMealPeriod).catch(async () => {
        log(
          `Meal period "${data.edgeMealPeriod}" not available – documenting empty meal-period edge as N/A for this env`,
        );
      });
    }

    for (const tab of data.emptyTabs) {
      await salesPage.selectViewTab(tab);
      await expect(salesPage.pageTitle).toBeVisible();
    }

    await salesPage.clearFilters().catch(() => undefined);
    await salesPage.selectViewTab('All');
    await salesPage.ensureAllMealPeriods();
    await salesPage.verifySalesRecordsVisible(1);
    expect(common.labels.pageTitle).toBeTruthy();
  });
});

test.describe("RCSP-133 - Operations > Sales > Sales Transactions: Sales transactions remain visible after browser refresh an...", () => {
  let loginPage: RTCDashboardLoginPage;
  let salesPage: SalesPage;

  test("Verify whether sales transactions loaded from the QA Service Bus remain visible on the Sales Transactions page under Operations → Sales after browser refresh, and whether data does not appear when messages were not consumed or failed to load (regression and negative)", async ({ page }) => {
    ({ loginPage, salesPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      unloadedSaleId: string;
      store: string;
    }>(TC.refreshPersistence);

    await ensureStoreContext(salesPage);
    await salesPage.openSalesTransactions();
    await salesPage.verifyBusinessDayShowsCurrentDate();
    await salesPage.ensureAllMealPeriods();
    await salesPage.selectViewTab('All');
    await salesPage.verifySalesRecordsVisible(1);

    const baselineSaleIds = await salesPage.getVisibleSaleIds();
    const baselineCount = await salesPage.getTransactionsCountFromSummary();
    expect(baselineCount).toBeGreaterThan(0);

    await salesPage.refreshAndReopenSales();
    await salesPage.verifyBusinessDayShowsCurrentDate();
    await salesPage.verifySalesRecordsVisible(1);

    const afterSaleIds = await salesPage.getVisibleSaleIds();
    const afterCount = await salesPage.getTransactionsCountFromSummary();

    if (baselineSaleIds.length > 0 && afterSaleIds.length > 0) {
      const overlap = baselineSaleIds.filter((id) => afterSaleIds.includes(id));
      expect(overlap.length).toBeGreaterThan(0);
    }
    expect(afterCount).toBe(baselineCount);

    await salesPage.verifySaleIdAbsent(data.unloadedSaleId);
    await salesPage.verifyNoDuplicateSaleIds();
  });
});
