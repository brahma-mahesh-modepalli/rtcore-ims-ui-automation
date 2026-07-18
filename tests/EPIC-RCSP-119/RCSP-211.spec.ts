/**
 * RCSP-211 – Stock Count color-coded variance indicator (Green / Red / Yellow)
 * and unrestricted SAVE COUNTS / LOCK COUNT across Daily / Weekly / Monthly.
 * Test case IDs: TC_RCSP-211_001 … TC_RCSP-211_018 (RCSP-211_TestCases.xlsx).
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { StockCountPage } from '../../pages/Stock Count/StockCountPage';
import { DailyShiftCountPage } from '../../pages/Stock Count/DailyShiftCountPage';
import { WeeklyCountPage } from '../../pages/Stock Count/WeeklyCountPage';
import { MonthlyCountPage } from '../../pages/Stock Count/MonthlyCountPage';
import { StoreInventoryItemsPage } from '../../pages/Stock Count/StoreInventoryItemsPage';
import {
  StockCountVariancePage,
  quantityForGreen,
  quantityForRed,
  type VarianceColor,
} from '../../pages/Stock Count/StockCountVariancePage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp211CommonData,
  type Rcsp211JsonData,
} from '../../utils/testData';

const RCSP_211_FILE_NAME = 'RCSP-211';
const RCSP_211_SCENARIO_ID = 'RCSP-211';

type CountType = 'Daily Shift Count' | 'Weekly Count' | 'Monthly Count';

type CaseData = {
  action: string;
  countType: CountType;
  expectedColor: VarianceColor;
  assertSaveAndLock: boolean;
  multiLocation: boolean;
};

const ALL_CASE_IDS = [
  'TC_RCSP-211_001',
  'TC_RCSP-211_002',
  'TC_RCSP-211_003',
  'TC_RCSP-211_004',
  'TC_RCSP-211_005',
  'TC_RCSP-211_006',
  'TC_RCSP-211_007',
  'TC_RCSP-211_008',
  'TC_RCSP-211_009',
  'TC_RCSP-211_010',
  'TC_RCSP-211_011',
  'TC_RCSP-211_012',
  'TC_RCSP-211_013',
  'TC_RCSP-211_014',
  'TC_RCSP-211_015',
  'TC_RCSP-211_016',
  'TC_RCSP-211_017',
  'TC_RCSP-211_018',
] as const;

function getCommonData(): Rcsp211CommonData {
  return getScenarioTestData<Rcsp211JsonData>(
    RCSP_211_FILE_NAME,
    RCSP_211_SCENARIO_ID,
  ).commonData;
}

function getCaseData(testCaseId: string): CaseData {
  return getScenarioTestCaseData<CaseData>(
    RCSP_211_FILE_NAME,
    RCSP_211_SCENARIO_ID,
    testCaseId,
  );
}

function sessionName(prefix: string, suffix: string): string {
  return `${prefix}-${suffix}-${Date.now().toString().slice(-6)}`;
}

async function prepare(page: Page) {
  const common = getCommonData();
  const loginPage = new RTCDashboardLoginPage(page);
  const transfersPage = new TransfersPage(page);
  const stockCountPage = new StockCountPage(page);
  const dailyPage = new DailyShiftCountPage(page);
  const weeklyPage = new WeeklyCountPage(page);
  const monthlyPage = new MonthlyCountPage(page);
  const variancePage = new StockCountVariancePage(page);
  const inventoryPage = new StoreInventoryItemsPage(page);

  await page.goto(CONFIG.dashboardURL);
  await page.waitForLoadState('domcontentloaded');
  await loginPage.login(
    CONFIG.credentials.admin.username,
    CONFIG.credentials.admin.password,
  );
  await transfersPage.switchStore(
    common.hierarchy.region,
    common.hierarchy.market,
    common.hierarchy.store,
  );

  return {
    common,
    stockCountPage,
    dailyPage,
    weeklyPage,
    monthlyPage,
    variancePage,
    inventoryPage,
  };
}

async function resolveVariancePercent(
  ctx: Awaited<ReturnType<typeof prepare>>,
): Promise<number> {
  const { common, inventoryPage } = ctx;
  try {
    await inventoryPage.navigateFromMenu();
    const fromUi = await inventoryPage.getVarianceThresholdPercent(
      common.item.name,
    );
    if (fromUi !== null) return fromUi;
  } catch (error) {
    log(`⚠ Store Inventory Items lookup skipped: ${String(error)}`);
  }
  log(
    `Using fallback variance threshold ${common.fallbackVarianceThresholdPercent}%`,
  );
  return common.fallbackVarianceThresholdPercent;
}

async function createCountSession(
  ctx: Awaited<ReturnType<typeof prepare>>,
  countType: CountType,
  caseId: string,
): Promise<void> {
  const { common, stockCountPage, dailyPage, weeklyPage, monthlyPage } = ctx;
  const shift = (common.createCount.shift || 'AM') as 'AM' | 'Mid-Shift' | 'PM';
  const name = sessionName(common.createCount.namePrefix ?? 'RCSP-211', caseId);

  if (countType === 'Daily Shift Count') {
    await stockCountPage.navigateToDailyShiftCount();
    await dailyPage.verifyDailyShiftCountPageLoaded();
    await dailyPage.createDailyShiftCount({
      shift: shift === 'Mid-Shift' ? 'Mid' : shift,
      shiftDate: common.createCount.shiftDate,
      name,
    });
    return;
  }

  if (countType === 'Weekly Count') {
    await stockCountPage.navigateToWeeklyCount();
    await weeklyPage.verifyWeeklyCountPageLoaded();
    await weeklyPage.startWeeklyCount(shift, {
      shiftDate: common.createCount.shiftDate,
      name,
    });
    return;
  }

  await stockCountPage.navigateToMonthlyCount();
  await monthlyPage.verifyMonthlyCountPageLoaded();
  await monthlyPage.startMonthlyCount(shift, {
    shiftDate: common.createCount.shiftDate,
  });
}

async function runVarianceScenario(
  page: Page,
  caseId: string,
): Promise<void> {
  const data = getCaseData(caseId);
  const ctx = await prepare(page);
  const { common, variancePage } = ctx;
  const itemName = common.item.name;
  const searchTerm = common.item.searchTerm || itemName;
  const primary = common.locations.primary;
  const secondary = common.locations.secondary;

  const variancePct = await resolveVariancePercent(ctx);
  await createCountSession(ctx, data.countType, caseId);

  if (data.multiLocation || data.expectedColor === 'yellow') {
    await variancePage.addItemWithLocation(searchTerm, itemName, primary);
    await variancePage.addItemWithLocation(searchTerm, itemName, secondary);

    let expected = common.fallbackExpectedQuantity;
    try {
      expected = await variancePage.readExpectedQuantity(itemName, primary);
    } catch {
      log(`Using fallback expected quantity ${expected}`);
    }

    const qty = quantityForGreen(expected, variancePct);
    await variancePage.enterEaQuantity(itemName, qty, primary);
    // Leave secondary location pending (no quantity)
    await variancePage.verifyVarianceColor(itemName, 'yellow');
  } else {
    await variancePage.addItemWithLocation(searchTerm, itemName, primary);

    let expected = common.fallbackExpectedQuantity;
    try {
      expected = await variancePage.readExpectedQuantity(itemName, primary);
    } catch {
      log(`Using fallback expected quantity ${expected}`);
    }

    const qty =
      data.expectedColor === 'red'
        ? quantityForRed(expected, variancePct)
        : quantityForGreen(expected, variancePct);

    log(
      `E=${expected}, V%=${variancePct}, color=${data.expectedColor}, qty=${qty}`,
    );
    await variancePage.enterEaQuantity(itemName, qty, primary);
    await variancePage.verifyVarianceColor(
      itemName,
      data.expectedColor,
      primary,
    );
  }

  // Excel expects SAVE COUNTS + LOCK COUNT allowed for Green / Red / Yellow
  await variancePage.saveAndLock();
}

test.describe.configure({ mode: 'serial' });

test.describe('RCSP-211 - Variance indicator (Green / Red / Yellow)', () => {
  for (const caseId of ALL_CASE_IDS.slice(0, 9)) {
    test(`${caseId} – variance indicator`, async ({ page }) => {
      test.slow();
      await runVarianceScenario(page, caseId);
    });
  }
});

test.describe('RCSP-211 - SAVE COUNTS / LOCK COUNT unrestricted by color', () => {
  for (const caseId of ALL_CASE_IDS.slice(9)) {
    test(`${caseId} – submission validation`, async ({ page }) => {
      test.slow();
      await runVarianceScenario(page, caseId);
    });
  }
});
