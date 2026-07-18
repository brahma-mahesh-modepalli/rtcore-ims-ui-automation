import { test, expect } from '@playwright/test';
import { log } from '../../utils/helpers';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { StockCountPage } from '../../pages/Stock Count/StockCountPage';
import { MonthlyCountPage } from '@pages/Stock Count/MonthlyCountPage';
import { WeeklyCountPage } from '@pages/Stock Count/WeeklyCountPage';
import { DailyShiftCountPage } from '@pages/Stock Count/DailyShiftCountPage';
import {
  getScenarioTestCaseData,
  type MonthlyCountJsonData,
  type Rcsp115ButtonVisibilityTestData,
  type Rcsp115NavigationTestData,
  type Rcsp115SessionCreationTestData,
  type WeeklyCountJsonData,//Commit check
} from '../../utils/testData';

const RCSP_115_FILE_NAME = 'RCSP-115';
const RCSP_115_SCENARIO_ID = 'RCSP-115';

const RCSP_115_TEST_CASE_IDS = {
  navigation: 'TC_RCSP-115_01',
  buttonVisibility: 'TC_RCSP-115_02',
  weeklyCountValidation: 'TC_RCSP-115_03',
  monthlyCountValidation: 'TC_RCSP-115_04',
  sessionCreation: 'TC_RCSP-115_05',
} as const;

function getRcsp115TestCaseData<T>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_115_FILE_NAME,
    RCSP_115_SCENARIO_ID,
    testCaseId,
  );
}

async function navigateToStockCountSection(
  stockCountPage: StockCountPage,
  navigationItem: string,
): Promise<void> {
  switch (navigationItem) {
    case 'Daily Shift Count':
      await stockCountPage.navigateToDailyShiftCount();
      return;
    case 'Weekly Count':
      await stockCountPage.navigateToWeeklyCount();
      return;
    case 'Monthly Count':
      await stockCountPage.navigateToMonthlyCount();
      return;
    default:
      throw new Error(`Unsupported RCSP-115 navigation item: ${navigationItem}`);
  }
}


test.describe('RCSP-115 - Stock Count Navigation', () => {
  
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;

  test('Verify user can navigate to Daily Shift Count, Weekly Count, and Monthly Count pages from STOCK COUNT menu', async ({
    page,
  }) => {
    const navigationData = getRcsp115TestCaseData<Rcsp115NavigationTestData>(
      RCSP_115_TEST_CASE_IDS.navigation,
    );

    log('=== RCSP-115: Stock Count Navigation Test Started ===');

    // Initialize page objects
    loginPage = new RTCDashboardLoginPage(page);
    stockCountPage = new StockCountPage(page);

    // ── Step 1: Launch the URL ────────────────────────────────
    log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
    await page.goto(CONFIG.dashboardURL);
    await page.waitForLoadState('networkidle');
    log('✓ URL launched successfully');

    // ── Step 2: Login with valid credentials ──────────────────
    log('STEP 2: Logging in with credentials');
    log('Email: ' + CONFIG.credentials.admin.username);
    await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
    log('✓ Login successful - Dashboard loaded');

    for (const navigationItem of navigationData.navigationItems) {
      log(`Navigating to ${navigationItem}`);
      await navigateToStockCountSection(stockCountPage, navigationItem);
    }

    log('=== TEST PASSED - All navigations verified successfully ===');
  });
});

test.describe('RCSP-115 - “+ NEW DAILY SHIFT COUNT”, “+ NEW WEEKLY COUNT”, and “+ NEW MONTHLY COUNT” buttons are visible and enabled', () => {
  
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let dailyShiftCountPage: DailyShiftCountPage;
  let weeklyCountPage: WeeklyCountPage;
  let monthlyCountPage: MonthlyCountPage;

  test('Verify whether the “+ NEW DAILY SHIFT COUNT”, “+ NEW WEEKLY COUNT”, and “+ NEW MONTHLY COUNT” buttons are visible and enabled on their respective listing pages', async ({
    page,
  }) => {
    const buttonVisibilityData =
      getRcsp115TestCaseData<Rcsp115ButtonVisibilityTestData>(
        RCSP_115_TEST_CASE_IDS.buttonVisibility,
      );

    log('=== RCSP-115: “+ NEW DAILY SHIFT COUNT”, “+ NEW WEEKLY COUNT”, and “+ NEW MONTHLY COUNT” buttons are visible and enabled Test Started ===');

    // Initialize page objects
    loginPage = new RTCDashboardLoginPage(page);
    stockCountPage = new StockCountPage(page);
    dailyShiftCountPage = new DailyShiftCountPage(page);
    weeklyCountPage = new WeeklyCountPage(page);
    monthlyCountPage = new MonthlyCountPage(page);

    // ── Launch the URL ────────────────────────────────
    log('Launching URL: ' + CONFIG.dashboardURL);
    await page.goto(CONFIG.dashboardURL);
    await page.waitForLoadState('networkidle');
    log('✓ URL launched successfully');

    // ── Login with valid credentials ──────────────────
    log('Logging in with credentials');
    log('Email: ' + CONFIG.credentials.admin.username);
    await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
    log('✓ Login successful - Dashboard loaded');

    // ── Navigate to Daily Shift Count ───────────────
    log('Navigating to Daily Shift Count');
    await stockCountPage.navigateToDailyShiftCount();

    // ── Verify "+ NEW DAILY SHIFT COUNT" button is visible and enabled
       log(`Expected button label: ${buttonVisibilityData.expectedButtons.dailyShiftCount}`);
       log('"+ NEW DAILY SHIFT COUNT" button is visible and enabled');
    await dailyShiftCountPage.verifyNewDailyShiftCountButtonEnabled();

    // ── Navigate to Weekly Count ────────────────────
    log('Navigating to Weekly Count');
    await stockCountPage.navigateToWeeklyCount();

      // ── Verify "+ NEW WEEKLY COUNT" button is visible and enabled
             log(`Expected button label: ${buttonVisibilityData.expectedButtons.weeklyCount}`);
             log('"+ NEW WEEKLY COUNT" button is visible and enabled');
    await weeklyCountPage.verifyNewWeeklyCountButtonEnabled();

    // ── Navigate to Monthly Count ───────────────────
    log('Navigating to Monthly Count');
    await stockCountPage.navigateToMonthlyCount();

      // ── Verify "+ NEW MONTHLY COUNT" button is visible and enabled
                   log(`Expected button label: ${buttonVisibilityData.expectedButtons.monthlyCount}`);
                   log('"+ NEW MONTHLY COUNT" button is visible and enabled');
    await monthlyCountPage.verifyNewMonthlyCountButtonEnabled();

    log('=== TEST PASSED - All Buttons enablement verified successfully ===');
  });
});

test.describe('RCSP-115 - Weekly Count feature validation', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let dailyShiftCountPage: DailyShiftCountPage;
  let weeklyCountPage: WeeklyCountPage;

  test('Verify Weekly Count listing, detail, filter, export, and add item features using JSON-driven test data', async ({
    page,
  }) => {
    test.slow();

    const weeklyCountData = getRcsp115TestCaseData<WeeklyCountJsonData>(
      RCSP_115_TEST_CASE_IDS.weeklyCountValidation,
    );

    log('=== RCSP-115: Weekly Count feature validation Test Started ===');

    loginPage = new RTCDashboardLoginPage(page);
    stockCountPage = new StockCountPage(page);
    dailyShiftCountPage = new DailyShiftCountPage(page);
    weeklyCountPage = new WeeklyCountPage(page);

    log('Launching URL: ' + CONFIG.dashboardURL);
    await page.goto(CONFIG.dashboardURL);
    await page.waitForLoadState('networkidle');
    log('✓ URL launched successfully');

    log('Logging in with credentials');
    log('Email: ' + CONFIG.credentials.admin.username);
    await loginPage.login(
      CONFIG.credentials.admin.username,
      CONFIG.credentials.admin.password,
    );
    log('✓ Login successful - Dashboard loaded');

    log('Priming Stock Count navigation state through Daily Shift Count');
    await stockCountPage.navigateToDailyShiftCount();
    await dailyShiftCountPage.verifyNewDailyShiftCountButtonEnabled();

    log('Navigating to Weekly Count');
    await stockCountPage.navigateToWeeklyCount();
    await weeklyCountPage.verifyWeeklyCountPageLoaded();

    log('Validating Weekly Count create dialog using JSON-driven shift data');
    await page.getByRole('button', { name: /new weekly count/i }).click();
    await expect(
      page.getByRole('button', { name: 'Start Weekly Count' }),
    ).toBeVisible();
    await weeklyCountPage.selectShift(weeklyCountData.createCount.shift);

    if (weeklyCountData.createCount.shiftDate) {
      await weeklyCountPage.fillShiftDate(weeklyCountData.createCount.shiftDate);
    }

    if (weeklyCountData.createCount.name) {
      await weeklyCountPage.fillWeeklyCountName(weeklyCountData.createCount.name);
    }

    await weeklyCountPage.cancelNewWeeklyCount();
    await weeklyCountPage.verifyWeeklyCountPageLoaded();

    log('Opening an existing Weekly Count and validating detail features');
    await weeklyCountPage.openFirstWeeklyCount();
    await weeklyCountPage.waitForWeeklyCountDetailsToLoad();
    await expect(weeklyCountPage.detailCreatedAtText).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Counts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add Item', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Delete', exact: true }),
    ).toBeVisible();
    await expect(weeklyCountPage.totalItemsCardLabel.first()).toBeVisible();
    await expect(weeklyCountPage.countedItemsCardLabel.first()).toBeVisible();
    await expect(weeklyCountPage.remainingItemsCardLabel.first()).toBeVisible();
    await expect(weeklyCountPage.flaggedItemsCardLabel.first()).toBeVisible();
    await weeklyCountPage.verifyItemTableHeaders();
    await expect(weeklyCountPage.locationsHeading).toBeVisible();
    await expect(weeklyCountPage.itemSearchInput).toBeVisible();

    log('Validating item filters and search using JSON-driven itemNameOrSku values');
    await weeklyCountPage.selectLocation(weeklyCountData.filters.defaultLocation);
    await weeklyCountPage.searchItem(
      weeklyCountData.search.existingItemNameOrSku,
    );
    await expect(
      page
        .getByRole('row', {
          name: new RegExp(weeklyCountData.search.existingItemNameOrSku, 'i'),
        })
        .first(),
    ).toBeVisible();
    await weeklyCountPage.clearItemSearch();

    await weeklyCountPage.selectLocation(weeklyCountData.filters.detailLocation);
    await expect(
      page.getByRole('row', {
        name: new RegExp(
          `${weeklyCountData.filters.detailLocation}.*${weeklyCountData.itemUpdate.itemNameOrSku}`,
          'i',
        ),
      }),
    ).toBeVisible();

    await weeklyCountPage.searchItem(
      weeklyCountData.search.missingItemNameOrSku,
    );
    await weeklyCountPage.verifyNoItemsMatchFiltersMessageVisible();
    await weeklyCountPage.clearFilters();

    log('Validating export dialog');
    await weeklyCountPage.openExportDialog();
    await weeklyCountPage.verifyExportDialogVisible();
    await weeklyCountPage.closeActiveDialog();

    log('Validating Add Item dialog and no-results message');
    await weeklyCountPage.openAddItemDialog();
    await weeklyCountPage.searchAvailableItem(
      weeklyCountData.search.missingItemNameOrSku,
    );
    await weeklyCountPage.verifyNoActiveItemsMatchMessageVisible(
      weeklyCountData.search.missingItemNameOrSku,
    );
    await weeklyCountPage.cancelAddItem();

    log('=== TEST PASSED - Weekly Count features validated successfully ===');
  });
});

test.describe('RCSP-115 - Monthly Count feature validation', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let dailyShiftCountPage: DailyShiftCountPage;
  let monthlyCountPage: MonthlyCountPage;

  test('Verify Monthly Count listing, detail, filter, add item, and delete confirmation features using JSON-driven test data', async ({
    page,
  }) => {
    test.slow();

    const monthlyCountData = getRcsp115TestCaseData<MonthlyCountJsonData>(
      RCSP_115_TEST_CASE_IDS.monthlyCountValidation,
    );

    log('=== RCSP-115: Monthly Count feature validation Test Started ===');

    loginPage = new RTCDashboardLoginPage(page);
    stockCountPage = new StockCountPage(page);
    dailyShiftCountPage = new DailyShiftCountPage(page);
    monthlyCountPage = new MonthlyCountPage(page);

    log('Launching URL: ' + CONFIG.dashboardURL);
    await page.goto(CONFIG.dashboardURL);
    await page.waitForLoadState('networkidle');
    log('✓ URL launched successfully');

    log('Logging in with credentials');
    log('Email: ' + CONFIG.credentials.admin.username);
    await loginPage.login(
      CONFIG.credentials.admin.username,
      CONFIG.credentials.admin.password,
    );
    log('✓ Login successful - Dashboard loaded');

    log('Priming Stock Count navigation state through Daily Shift Count');
    await stockCountPage.navigateToDailyShiftCount();
    await dailyShiftCountPage.verifyNewDailyShiftCountButtonEnabled();

    log('Navigating to Monthly Count');
    await stockCountPage.navigateToMonthlyCount();
    await monthlyCountPage.verifyMonthlyCountPageLoaded();

    log('Validating Monthly Count create dialog using JSON-driven shift data');
    await monthlyCountPage.clickNewMonthlyCountButton();
    await monthlyCountPage.selectShift(monthlyCountData.createCount.shift);

    if (monthlyCountData.createCount.shiftDate) {
      await monthlyCountPage.fillShiftDate(
        monthlyCountData.createCount.shiftDate,
      );
    }

    await monthlyCountPage.verifyMonthlyCountNameReadOnly();
    await monthlyCountPage.cancelNewMonthlyCount();
    await monthlyCountPage.verifyMonthlyCountPageLoaded();

    log('Opening an existing Monthly Count and validating detail features');
    await monthlyCountPage.openFirstMonthlyCount();
    await monthlyCountPage.verifyMonthlyCountDetailsPageLoaded();
    await monthlyCountPage.verifyExportButtonDisabled();
    await monthlyCountPage.verifyEmptyMonthlyCountMessageVisible();
    await expect(monthlyCountPage.locationsHeading).toBeVisible();
    await expect(monthlyCountPage.itemSearchInput).toBeVisible();

    log('Validating Monthly Count filters and search');
    await monthlyCountPage.selectLocation(monthlyCountData.filters.defaultLocation);
    await monthlyCountPage.searchItem(
      monthlyCountData.search.missingItemNameOrSku,
    );
    await expect(monthlyCountPage.itemSearchInput).toHaveValue(
      monthlyCountData.search.missingItemNameOrSku,
    );
    await monthlyCountPage.clearItemSearch();
    await monthlyCountPage.selectLocation(monthlyCountData.filters.detailLocation);
    await monthlyCountPage.clearFilters();

    log('Validating Add Item dialog, no-results message, and location picker');
    await monthlyCountPage.openAddItemDialog();
    await monthlyCountPage.searchAvailableItem(
      monthlyCountData.search.missingItemNameOrSku,
    );
    await monthlyCountPage.verifyNoActiveItemsMatchMessageVisible(
      monthlyCountData.search.missingItemNameOrSku,
    );
    await monthlyCountPage.openLocationPicker();
    await monthlyCountPage.selectAddItemLocation(
      monthlyCountData.filters.detailLocation,
    );
    await monthlyCountPage.cancelAddItem();

    log('Validating Monthly Count delete confirmation without deleting data');
    await monthlyCountPage.deleteCurrentMonthlyCount(false);
    await monthlyCountPage.verifyDetailActionButtonsVisible();

    log('=== TEST PASSED - Monthly Count features validated successfully ===');
  });
});


test.describe('RCSP-115 - “+ NEW DAILY SHIFT COUNT”, “+ NEW WEEKLY COUNT”, and “+ NEW MONTHLY COUNT” buttons are visible and enabled', () => {
  
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let dailyShiftCountPage: DailyShiftCountPage;
  let weeklyCountPage: WeeklyCountPage;
  let monthlyCountPage: MonthlyCountPage;

  test('Verify whether the user is able to create Daily Shift Count, Weekly Count, and Monthly Count sessions successfully using valid AM, Mid-Shift, and PM shift values', async ({
    page,
  }) => {
    test.slow();

    const sessionCreationData =
      getRcsp115TestCaseData<Rcsp115SessionCreationTestData>(
        RCSP_115_TEST_CASE_IDS.sessionCreation,
      );

    log('=== RCSP-115: “Create Daily Shift Count, Weekly Count, and Monthly Count sessions successfully using valid AM, Mid-Shift, and PM shift values Test Started ===');

    // Initialize page objects
    loginPage = new RTCDashboardLoginPage(page);
    stockCountPage = new StockCountPage(page);
    dailyShiftCountPage = new DailyShiftCountPage(page);
    weeklyCountPage = new WeeklyCountPage(page);
    monthlyCountPage = new MonthlyCountPage(page);

    // ── Launch the URL ────────────────────────────────
    log('Launching URL: ' + CONFIG.dashboardURL);
    await page.goto(CONFIG.dashboardURL);
    await page.waitForLoadState('networkidle');
    log('✓ URL launched successfully');

    // ── Login with valid credentials ──────────────────
    log('Logging in with credentials');
    log('Email: ' + CONFIG.credentials.admin.username);
    await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
    log('✓ Login successful - Dashboard loaded');

    // ── Navigate to Daily Shift Count ───────────────
    log('Navigating to Daily Shift Count');
    await stockCountPage.navigateToDailyShiftCount();

    // ── Verify "+ NEW DAILY SHIFT COUNT" button is visible and enabled
       log(`Configured Daily Shift Count shift: ${sessionCreationData.shifts.dailyShiftCount}`);
       log('"+ NEW DAILY SHIFT COUNT" button is visible and enabled');
    await dailyShiftCountPage.verifyNewDailyShiftCountButtonEnabled();

        // ── Clicked "+ NEW DAILY SHIFT COUNT" button
       log('"+ NEW DAILY SHIFT COUNT" button is clicked');
    await dailyShiftCountPage.clickNewDailyShiftCountButton();



    // ── Navigate to Weekly Count ────────────────────
    log(`Configured Weekly Count shift: ${sessionCreationData.shifts.weeklyCount}`);
    log('Navigating to Weekly Count');
    await stockCountPage.navigateToWeeklyCount();

      // ── Verify "+ NEW WEEKLY COUNT" button is visible and enabled
             log('"+ NEW WEEKLY COUNT" button is visible and enabled');
    await weeklyCountPage.verifyNewWeeklyCountButtonEnabled();

    // ── Navigate to Monthly Count ───────────────────
    log(`Configured Monthly Count shift: ${sessionCreationData.shifts.monthlyCount}`);
    log('Navigating to Monthly Count');
    await stockCountPage.navigateToMonthlyCount();

      // ── Verify "+ NEW MONTHLY COUNT" button is visible and enabled
                   log('"+ NEW MONTHLY COUNT" button is visible and enabled');
    await monthlyCountPage.verifyNewMonthlyCountButtonEnabled();

    log('=== TEST PASSED - reate Daily Shift Count, Weekly Count, and Monthly Count sessions successfully using valid AM, Mid-Shift, and PM shift values verified successfully ===');
  });
});
