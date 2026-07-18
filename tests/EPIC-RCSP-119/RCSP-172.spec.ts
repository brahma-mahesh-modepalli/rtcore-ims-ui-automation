/**
 * RCSP-172 – Stock Count Add Item searchable type-ahead
 * Test case IDs use TC_RCSP-172_* format (10 cases from RCSP-172_TestCases.xls).
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { StockCountPage } from '../../pages/Stock Count/StockCountPage';
import { DailyShiftCountPage } from '../../pages/Stock Count/DailyShiftCountPage';
import { WeeklyCountPage } from '../../pages/Stock Count/WeeklyCountPage';
import { MonthlyCountPage } from '../../pages/Stock Count/MonthlyCountPage';
import { StockCountAddItemPage } from '../../pages/Stock Count/StockCountAddItemPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp172CommonData,
  type Rcsp172JsonData,
} from '../../utils/testData';

const RCSP_172_FILE_NAME = 'RCSP-172';
const RCSP_172_SCENARIO_ID = 'RCSP-172';

const TC = {
  openAddItem: 'TC_RCSP-172_01',
  searchPartialName: 'TC_RCSP-172_02',
  searchByPlu: 'TC_RCSP-172_03',
  excludeInactive: 'TC_RCSP-172_04',
  autoPopulate: 'TC_RCSP-172_05',
  uomReadOnly: 'TC_RCSP-172_06',
  searchInvalid: 'TC_RCSP-172_07',
  searchSpecialChars: 'TC_RCSP-172_08',
  searchWithSpaces: 'TC_RCSP-172_09',
  searchCaseInsensitive: 'TC_RCSP-172_10',
} as const;

type CountType = 'Daily Shift Count' | 'Weekly Count' | 'Monthly Count';

function getCommonData(): Rcsp172CommonData {
  return getScenarioTestData<Rcsp172JsonData>(
    RCSP_172_FILE_NAME,
    RCSP_172_SCENARIO_ID,
  ).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_172_FILE_NAME,
    RCSP_172_SCENARIO_ID,
    testCaseId,
  );
}

async function prepare(page: Page) {
  const common = getCommonData();
  const loginPage = new RTCDashboardLoginPage(page);
  const stockCountPage = new StockCountPage(page);
  const dailyPage = new DailyShiftCountPage(page);
  const weeklyPage = new WeeklyCountPage(page);
  const monthlyPage = new MonthlyCountPage(page);
  const addItemPage = new StockCountAddItemPage(page);
  const transfersPage = new TransfersPage(page);

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
    loginPage,
    stockCountPage,
    dailyPage,
    weeklyPage,
    monthlyPage,
    addItemPage,
    transfersPage,
  };
}

async function openCountWithAddItem(
  countType: CountType,
  ctx: Awaited<ReturnType<typeof prepare>>,
): Promise<void> {
  const { common, stockCountPage, dailyPage, weeklyPage, monthlyPage, addItemPage } =
    ctx;
  const shift = (common.createCount.shift || 'AM') as 'AM' | 'Mid-Shift' | 'PM';

  log(`Preparing ${countType} and opening Add Item`);

  if (countType === 'Daily Shift Count') {
    await stockCountPage.navigateToDailyShiftCount();
    await dailyPage.verifyDailyShiftCountPageLoaded();
    try {
      await dailyPage.createDailyShiftCount({
        shift,
        shiftDate: common.createCount.shiftDate,
        name: common.createCount.dailyName,
      });
    } catch {
      log('Create Daily failed or dialog differed; opening existing count');
      await stockCountPage.navigateToDailyShiftCount();
      await dailyPage.openFirstDailyShiftCount();
    }
    await dailyPage.openAddItemDialog();
  } else if (countType === 'Weekly Count') {
    await stockCountPage.navigateToWeeklyCount();
    await weeklyPage.verifyWeeklyCountPageLoaded();
    try {
      await weeklyPage.startWeeklyCount(shift, {
        shiftDate: common.createCount.shiftDate,
        name: common.createCount.weeklyName,
      });
    } catch {
      log('Create Weekly failed or dialog differed; opening existing count');
      await stockCountPage.navigateToWeeklyCount();
      await weeklyPage.openFirstWeeklyCount();
    }
    await weeklyPage.openAddItemDialog();
  } else {
    await stockCountPage.navigateToMonthlyCount();
    await monthlyPage.verifyMonthlyCountPageLoaded();
    try {
      await monthlyPage.startMonthlyCount(shift, {
        shiftDate: common.createCount.shiftDate,
      });
    } catch {
      log('Create Monthly failed or dialog differed; opening existing count');
      await stockCountPage.navigateToMonthlyCount();
      await monthlyPage.openFirstMonthlyCount();
    }
    await monthlyPage.openAddItemDialog();
  }

  await addItemPage.verifyDialogOpen();
}

async function forEachCountType(
  countTypes: string[],
  ctx: Awaited<ReturnType<typeof prepare>>,
  fn: (countType: CountType) => Promise<void>,
): Promise<void> {
  for (const raw of countTypes) {
    const countType = raw as CountType;
    await fn(countType);
    await ctx.addItemPage.cancel().catch(() => undefined);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('RCSP-172 - Navigate to Daily/Weekly/Monthly and open Add Item popup', () => {
  test('Verify whether the user can navigate to Daily Shift Count, Weekly Count, and Monthly Count and open Add Item popup', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{ countTypes: string[] }>(TC.openAddItem);
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await expect(
        page.getByPlaceholder(/search by name or plu/i).first(),
      ).toBeVisible();
    });
  });
});

test.describe('RCSP-172 - Partial item name type-ahead returns matching active items', () => {
  test('Verify whether searchable type-ahead returns matching items for partial name search across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{ searchTerm: string; countTypes: string[] }>(
      TC.searchPartialName,
    );
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.search(data.searchTerm);
      await ctx.addItemPage.verifyMatchingResults(data.searchTerm);
    });
  });
});

test.describe('RCSP-172 - PLU type-ahead returns matching active items', () => {
  test('Verify whether searchable type-ahead returns matching items for PLU search across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{ searchTerm: string; countTypes: string[] }>(
      TC.searchByPlu,
    );
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.search(data.searchTerm);
      await ctx.addItemPage.verifyMatchingResults(data.searchTerm);
    });
  });
});

test.describe('RCSP-172 - Inactive items are excluded from type-ahead', () => {
  test('Verify whether inactive inventory items are excluded from Add Item search results across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{
      inactiveSearchTerm: string;
      countTypes: string[];
    }>(TC.excludeInactive);
    const ctx = await prepare(page);

    test.skip(
      !data.inactiveSearchTerm ||
        /DO-NOT-USE/i.test(data.inactiveSearchTerm),
      'Set a real inactive item/PLU in RCSP-172.json commonData.inactiveItem.searchTerm',
    );

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.verifyInactiveItemExcluded(data.inactiveSearchTerm);
    });
  });
});

test.describe('RCSP-172 - Item name, PLU, and UOM auto-populate after selection', () => {
  test('Verify whether item name, PLU, and UOM auto-populate after selecting an item across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{
      searchTerm: string;
      preferredItem: string;
      countTypes: string[];
    }>(TC.autoPopulate);
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.search(data.searchTerm);
      await ctx.addItemPage.selectFirstMatchingResult(data.preferredItem);
      await ctx.addItemPage.verifyFieldsAutoPopulated();
    });
  });
});

test.describe('RCSP-172 - UOM remains read-only after item selection', () => {
  test('Verify whether UOM remains read-only after selecting an item across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{
      searchTerm: string;
      preferredItem: string;
      countTypes: string[];
    }>(TC.uomReadOnly);
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.search(data.searchTerm);
      await ctx.addItemPage.selectFirstMatchingResult(data.preferredItem);
      await ctx.addItemPage.verifyUomReadOnly();
    });
  });
});

test.describe('RCSP-172 - Invalid item search shows no matches', () => {
  test('Verify whether invalid item search shows no matching results across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{ searchTerm: string; countTypes: string[] }>(
      TC.searchInvalid,
    );
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.search(data.searchTerm);
      await ctx.addItemPage.verifyNoMatchingResults(data.searchTerm);
    });
  });
});

test.describe('RCSP-172 - Special characters in item search are handled safely', () => {
  test('Verify whether special character search does not crash and returns no unrelated items across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{ searchTerm: string; countTypes: string[] }>(
      TC.searchSpecialChars,
    );
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.search(data.searchTerm);
      await ctx.addItemPage.verifyNoMatchingResults();
    });
  });
});

test.describe('RCSP-172 - Leading/trailing spaces are trimmed in item search', () => {
  test('Verify whether leading and trailing spaces still return matching items across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{
      searchTerm: string;
      expectedMatchFragment: string;
      countTypes: string[];
    }>(TC.searchWithSpaces);
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.search(data.searchTerm);
      await ctx.addItemPage.verifyMatchingResults(data.expectedMatchFragment);
    });
  });
});

test.describe('RCSP-172 - Case-insensitive item search', () => {
  test('Verify whether uppercase and lowercase searches return the same matching items across count pages', async ({
    page,
  }) => {
    test.slow();
    const data = getCaseData<{
      upperSearchTerm: string;
      lowerSearchTerm: string;
      countTypes: string[];
    }>(TC.searchCaseInsensitive);
    const ctx = await prepare(page);

    await forEachCountType(data.countTypes, ctx, async (countType) => {
      await openCountWithAddItem(countType, ctx);
      await ctx.addItemPage.search(data.upperSearchTerm);
      const upper = await ctx.addItemPage.getVisibleResultTexts();
      await ctx.addItemPage.search(data.lowerSearchTerm);
      const lower = await ctx.addItemPage.getVisibleResultTexts();
      expect(upper.length).toBeGreaterThan(0);
      expect(lower.length).toBeGreaterThan(0);
      const normalize = (arr: string[]) =>
        arr.map((x) => x.toLowerCase().replace(/\s+/g, ' ').trim()).sort();
      expect(normalize(upper)).toEqual(normalize(lower));
    });
  });
});
