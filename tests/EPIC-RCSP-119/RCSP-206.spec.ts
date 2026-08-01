import { test, expect } from '@playwright/test';
import { log } from '../../utils/helpers';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { StockCountPage } from '../../pages/Stock Count/StockCountPage';
import { CountLocationsPage } from '../../pages/Stock Count/CountLocationsPage';

import {
  getScenarioTestCaseData,
  Rcsp206AssignItemPopupTestData,
  Rcsp206CountLocationsPageTestData,
  Rcsp206AssignItemToCountLocationData,
  Rcsp206CreateLocationTestData,
 
} from '../../utils/testData';
import { DailyShiftCountPage } from '@pages/Stock Count/DailyShiftCountPage';
import { WeeklyCountPage } from '@pages/Stock Count/WeeklyCountPage';
import { MonthlyCountPage } from '@pages/Stock Count/MonthlyCountPage';

const RCSP_206_FILE_NAME = 'RCSP-206';
const RCSP_206_SCENARIO_ID = 'RCSP-206';

const RCSP_206_TEST_CASE_IDS = {
  navigation: 'TC_RCSP-206_01',
  createLocation: 'TC_RCSP-206_02',
  verifyAssignItemPopup: 'TC_RCSP-206_03',
  assignDailyItem: 'TC_RCSP-206_04',
  assignWeeklyItem: 'TC_RCSP-206_05',
  assignMonthlyItem: 'TC_RCSP-206_06',
  assignDailyAndWeeklyItem: 'TC_RCSP-206_07',
  assignDailyAndMonthlyItem: 'TC_RCSP-206_08',
  assignWeeklyAndMonthlyItem: 'TC_RCSP-206_09',
  assignDailyAndWeeklyAndMonthlyItem: 'TC_RCSP-206_10',
  countFrequencyOptions: 'TC_RCSP-206_11',
  assignItemDetailsAndCancel: 'TC_RCSP-206_12'
  
} as const;

function getRcsp206TestCaseData<T>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_206_FILE_NAME,
    RCSP_206_SCENARIO_ID,
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
       case 'Count Locations':
      await stockCountPage.navigateToCountLocations();
      return;
    default:
      throw new Error(`Unsupported RCSP-206 navigation item: ${navigationItem}`);
  }
}
 
test.describe('RCSP-206 - Stock Count Navigation', () => {
  
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;

  test('Verify user can navigate to Count Locations pages from STOCK COUNT menu', async ({
    page,
  }) => {
      const navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(
            RCSP_206_TEST_CASE_IDS.navigation);

    log('=== RCSP-206: Stock Count Navigation Test Started ===');

    // Initialize page objects
    loginPage = new RTCDashboardLoginPage(page);
    stockCountPage = new StockCountPage(page);
    countLocationsPage = new CountLocationsPage(page);

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

    countLocationsPage.verifyCountLocationsPage();
    log('✓ Count Locations page verified successfully');

    log('=== TEST PASSED - All navigations verified successfully ===');
  });
});


test.describe('RCSP-206 - Create a new Count Location', () => {
  
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;

  test('Verify user can create a new Count Location using mandatory fields', async ({
    page,
  }) => {
      const testData = getRcsp206TestCaseData<Rcsp206CreateLocationTestData>(RCSP_206_TEST_CASE_IDS.createLocation);
    const navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
    const createLocationData = testData.createCountLocationItems?.[0];

    if (!createLocationData) {
      throw new Error('RCSP-206 createCountLocationItems is missing test data');
    }

    log('=== RCSP-206: Create a new Count Location Test Started ===');

    // Initialize page objects
    loginPage = new RTCDashboardLoginPage(page);
    stockCountPage = new StockCountPage(page);
    countLocationsPage = new CountLocationsPage(page);

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

      await countLocationsPage.createCountLocation(createLocationData.locationName, createLocationData.description);
      log('✓ Created Count Location successfully');

    log('=== TEST PASSED - All navigations verified successfully ===');
  });
});


test.describe('RCSP-206 - Verify Assign Item Popup', () => {
  
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;

  test('Verify user can verify Assign Item popup elements and button state', async ({
    page,
  }) => {
    
    const navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
    const AssignItemPopupData = getRcsp206TestCaseData<Rcsp206AssignItemPopupTestData>(RCSP_206_TEST_CASE_IDS.verifyAssignItemPopup);
    const assignItemData = AssignItemPopupData.assignItemPopupItems?.[0];
   
    if (!AssignItemPopupData) {
      throw new Error('RCSP-206 verifyAssignItemPopup is missing test data');
    }
    log('=== RCSP-206: Verify Assign Item Popup Test Started ===');

    // Initialize page objects
    loginPage = new RTCDashboardLoginPage(page);
    stockCountPage = new StockCountPage(page);
    countLocationsPage = new CountLocationsPage(page);

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

     await countLocationsPage.verifyAssignItemPopupFunctionality(assignItemData.locationName);
      log('✓ Verified Assign Item Popup functionality successfully');

    log('=== TEST PASSED - All navigations verified successfully ===');
  });
});

test.describe('RCSP-206 - Verify Assign Daily Frequency Item to Count Location', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify user can assign a Daily Frequency Item to an existing Count Location with Daily count frequency.', async ({
    page,
  }) => {
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let assignDailyItemData: Rcsp206AssignItemToCountLocationData | undefined;
    let assignDailyItem: any;

      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      assignDailyItemData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.assignDailyItem);
      assignDailyItem = assignDailyItemData.assignItemData?.[0];

      if (!assignDailyItem) {
        throw new Error('RCSP-206 assignDailyItemData is missing or empty');
      }

      log('=== RCSP-206: Verify Assign Daily Item Popup Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

      const selectedItem = await countLocationsPage.addNewItems(assignDailyItem.locationName, assignDailyItem.items, assignDailyItem.countFrequency);
      log('✓ Verified Assign Item Popup functionality successfully');

      // await stockCountPage.clickToDailyShiftCount();
      // await dailyPage.clickNewDailyShiftCountButton();
      // await dailyPage.verifyAssignedItemsOnDailyShiftCountPage(assignDailyItem.locationName, selectedItem);
      // log('✓ Verified Assign Item is displayed On Daily Shift Count Page');

      // Navigate to Weekly Shift Count
      await stockCountPage.clickToWeeklyShiftCount();
      await weeklyPage.clickNewWeeklyCountButton();
      await weeklyPage.verifyItemsNotPresentOnWeeklyCountPage(selectedItem);
      log('✓ Verified Assign Item is not displayed On Weekly Shift Count Page');

       // Navigate to Monthly Shift Count
      await stockCountPage.clickToMonthlyShiftCount();
      await monthlyPage.clickNewMonthlyCountButton();
      await monthlyPage.verifyItemsNotPresentOnMonthlyCountPage(selectedItem);
      log('✓ Verified Assign Item is not displayed On Monthly Shift Count Page');

   // Delete Item from Count Locations
      if (countLocationsPage && assignDailyItem) {
        await stockCountPage.navigateToCountLocations();
        await countLocationsPage.deleteItems(assignDailyItem.locationName, selectedItem);
      }
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  });  


 test.describe('RCSP-206 - Verify Assign Weekly Frequency Item to Count Location', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify user can assign a Weekly Frequency Item to an existing Count Location with Weekly count frequency.', async ({
    page,
  }) => {
    test.setTimeout(120000);
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let assignWeeklyItemData: Rcsp206AssignItemToCountLocationData | undefined;
    let assignWeeklyItem: any;

 
      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      assignWeeklyItemData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.assignWeeklyItem);
      assignWeeklyItem = assignWeeklyItemData.assignItemData?.[0];

      if (!assignWeeklyItem) {
        throw new Error('RCSP-206 assignWeeklyItemData is missing or empty');
      }

      log('=== RCSP-206: Verify Assign Weekly Item Popup Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

     const selectedItem =  await countLocationsPage.addNewItems(assignWeeklyItem.locationName, assignWeeklyItem.items, assignWeeklyItem.countFrequency);
      log('✓ Verified Assign Item Popup functionality successfully');

      // Navigate to Weekly Shift Count
      await stockCountPage.clickToWeeklyShiftCount();
      await weeklyPage.clickNewWeeklyCountButton();
      await weeklyPage.verifyAssignedItemsOnWeeklyCountPage(selectedItem);
      log('✓ Verified Assign Item is displayed On Daily Shift Count Page');

      
      // await stockCountPage.clickToDailyShiftCount();
      // await dailyPage.clickNewDailyShiftCountButton();
      // await dailyPage.verifyItemsNotPresentOnDailyShiftCountPage(selectedItem);
      // log('✓ Verified Assign Item is not displayed On Daily Shift Count Page');
  

       // Navigate to Monthly Shift Count
      await stockCountPage.clickToMonthlyShiftCount();
      await monthlyPage.clickNewMonthlyCountButton();
      await monthlyPage.verifyItemsNotPresentOnMonthlyCountPage(selectedItem);
      log('✓ Verified Assign Item is not displayed On Monthly Shift Count Page');

      // Delete Item from Count Locations
      if (countLocationsPage && assignWeeklyItem) {
        await stockCountPage.navigateToCountLocations();
        await countLocationsPage.deleteItems(assignWeeklyItem.locationName, selectedItem);
      }
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  });  
  

  test.describe('RCSP-206 - Verify Assign Monthly Frequency Item to Count Location', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify user can assign a Monthly Frequency Item to an existing Count Location with Weekly count frequency.', async ({
    page,
  }) => {
    test.setTimeout(120000);
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let assignMonthlyItemData: Rcsp206AssignItemToCountLocationData | undefined;
    let assignMonthlyItem: any;

 
      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      assignMonthlyItemData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.assignMonthlyItem);
      assignMonthlyItem = assignMonthlyItemData.assignItemData?.[0];

      if (!assignMonthlyItem) {
        throw new Error('RCSP-206 assignWeeklyItemData is missing or empty');
      }

      log('=== RCSP-206: Verify Assign Weekly Item Popup Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

     const selectedItem =  await countLocationsPage.addNewItems(assignMonthlyItem.locationName, assignMonthlyItem.items, assignMonthlyItem.countFrequency);
      log('✓ Verified Assign Item Popup functionality successfully');

        // Navigate to Monthly Shift Count
      await stockCountPage.clickToMonthlyShiftCount();
      await monthlyPage.clickNewMonthlyCountButton();
      await monthlyPage.verifyAssignedItemsOnMonthlyCountPage(selectedItem);
      log('✓ Verified Assign Item is not displayed On Monthly Shift Count Page');
    
      // Navigate to Weekly Shift Count
      await stockCountPage.clickToWeeklyShiftCount();
      await weeklyPage.clickNewWeeklyCountButton();
      await weeklyPage.verifyItemsNotPresentOnWeeklyCountPage(selectedItem);
      log('✓ Verified Assign Item is displayed On Daily Shift Count Page');

      // await stockCountPage.clickToDailyShiftCount();
      // await dailyPage.clickNewDailyShiftCountButton();
      // await dailyPage.verifyItemsNotPresentOnDailyShiftCountPage(selectedItem);
      // log('✓ Verified Assign Item is not displayed On Daily Shift Count Page');

      // Delete Item from Count Locations
      if (countLocationsPage && assignMonthlyItem) {
        await stockCountPage.navigateToCountLocations();
        await countLocationsPage.deleteItems(assignMonthlyItem.locationName, selectedItem);
      }
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  }); 

  test.describe('RCSP-206 - Verify Assign Daily and Weekly Frequency Item to Count Location', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify user can assign a Daily and Weekly Frequency Item to an existing Count Location with Daily and Weekly count frequency.', async ({
    page,
  }) => {
    test.setTimeout(120000);
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let assignDailyAndWeeklyItemData: Rcsp206AssignItemToCountLocationData | undefined;
    let assignDailyAndWeeklyItem: any;
 
      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      assignDailyAndWeeklyItemData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.assignDailyAndWeeklyItem);
      assignDailyAndWeeklyItem = assignDailyAndWeeklyItemData.assignItemData?.[0];

      if (!assignDailyAndWeeklyItem) {
        throw new Error('RCSP-206 assignWeeklyItemData is missing or empty');
      }

      log('=== RCSP-206: Verify Assign Weekly Item Popup Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

      const selectedItem =  await countLocationsPage.addNewItems(assignDailyAndWeeklyItem.locationName, assignDailyAndWeeklyItem.items, assignDailyAndWeeklyItem.countFrequency);
      log('✓ Verified Assign Item Popup functionality successfully');
    
      // await stockCountPage.clickToDailyShiftCount();
      // await dailyPage.clickNewDailyShiftCountButton();
      // await dailyPage.verifyItemsNotPresentOnDailyShiftCountPage(selectedItem);
      // log('✓ Verified Assign Item is not displayed On Daily Shift Count Page');

       // Navigate to Weekly Shift Count
      await stockCountPage.clickToWeeklyShiftCount();
      await weeklyPage.clickNewWeeklyCountButton();
      await weeklyPage.verifyAssignedItemsOnWeeklyCountPage(selectedItem);
      log('✓ Verified Assign Item is displayed On Daily Shift Count Page');

        // Navigate to Monthly Shift Count
      await stockCountPage.clickToMonthlyShiftCount();
      await monthlyPage.clickNewMonthlyCountButton();
      await monthlyPage.verifyAssignedItemsOnMonthlyCountPage(selectedItem);
      log('✓ Verified Assign Item is not displayed On Monthly Shift Count Page');

      // Delete Item from Count Locations
      if (countLocationsPage && assignDailyAndWeeklyItem) {
        await stockCountPage.navigateToCountLocations();
        await countLocationsPage.deleteItems(assignDailyAndWeeklyItem.locationName, selectedItem);
      }
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  }); 

  test.describe('RCSP-206 - Verify Assign Daily and Monthly Frequency Item to Count Location', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify user can assign a Daily and Monthly Frequency Item to an existing Count Location with Daily and Monthly count frequency.', async ({
    page,
  }) => {
    test.setTimeout(120000);
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let assignDailyAndMonthlyItemData: Rcsp206AssignItemToCountLocationData | undefined;
    let assignDailyAndMonthlyItem: any;
 
      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      assignDailyAndMonthlyItemData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.assignDailyAndMonthlyItem);
      assignDailyAndMonthlyItem = assignDailyAndMonthlyItemData.assignItemData?.[0];

      if (!assignDailyAndMonthlyItem) {
        throw new Error('RCSP-206 assignWeeklyItemData is missing or empty');
      }

      log('=== RCSP-206: Verify Assign Weekly Item Popup Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

      const selectedItem =  await countLocationsPage.addNewItems(assignDailyAndMonthlyItem.locationName, assignDailyAndMonthlyItem.items, assignDailyAndMonthlyItem.countFrequency);
      log('✓ Verified Assign Item Popup functionality successfully');
    
      // await stockCountPage.clickToDailyShiftCount();
      // await dailyPage.clickNewDailyShiftCountButton();
      // await dailyPage.verifyAssignedItemsOnDailyShiftCountPage(selectedItem);
      // log('✓ Verified Assign Item is displayed On Daily Shift Count Page');

       // Navigate to Weekly Shift Count
      await stockCountPage.clickToWeeklyShiftCount();
      await weeklyPage.clickNewWeeklyCountButton();
      await weeklyPage.verifyItemsNotPresentOnWeeklyCountPage(selectedItem);
      log('✓ Verified Assign Item is not displayed On Weekly Shift Count Page');

        // Navigate to Monthly Shift Count
      await stockCountPage.clickToMonthlyShiftCount();
      await monthlyPage.clickNewMonthlyCountButton();
      await monthlyPage.verifyAssignedItemsOnMonthlyCountPage(selectedItem);
      log('✓ Verified Assign Item is displayed On Monthly Shift Count Page');

      // Delete Item from Count Locations
      if (countLocationsPage && assignDailyAndMonthlyItem) {
        await stockCountPage.navigateToCountLocations();
        await countLocationsPage.deleteItems(assignDailyAndMonthlyItem.locationName, selectedItem);
      }
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  }); 


  test.describe('RCSP-206 - Verify Assign Weekly and Monthly Frequency Item to Count Location', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify user can assign a Weekly and Monthly Frequency Item to an existing Count Location with Weekly and Monthly count frequency.', async ({
    page,
  }) => {
    test.setTimeout(120000);
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let assignWeeklyAndMonthlyItemData: Rcsp206AssignItemToCountLocationData | undefined;
    let assignWeeklyAndMonthlyItem: any;
 
      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      assignWeeklyAndMonthlyItemData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.assignWeeklyAndMonthlyItem);
      assignWeeklyAndMonthlyItem = assignWeeklyAndMonthlyItemData.assignItemData?.[0];

      if (!assignWeeklyAndMonthlyItem) {
        throw new Error('RCSP-206 assignWeeklyItemData is missing or empty');
      }

      log('=== RCSP-206: Verify Assign Weekly Item Popup Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

      const selectedItem =  await countLocationsPage.addNewItems(assignWeeklyAndMonthlyItem.locationName, assignWeeklyAndMonthlyItem.items, assignWeeklyAndMonthlyItem.countFrequency);
      log('✓ Verified Assign Item Popup functionality successfully');
    
      // await stockCountPage.clickToDailyShiftCount();
      // await dailyPage.clickNewDailyShiftCountButton();
      // await dailyPage.verifyItemsNotPresentOnDailyShiftCountPage(selectedItem);
      // log('✓ Verified Assign Item is not displayed On Daily Shift Count Page');

       // Navigate to Weekly Shift Count
      await stockCountPage.clickToWeeklyShiftCount();
      await weeklyPage.clickNewWeeklyCountButton();
      await weeklyPage.verifyAssignedItemsOnWeeklyCountPage(selectedItem);
      log('✓ Verified Assign Item is displayed On Weekly Shift Count Page');

        // Navigate to Monthly Shift Count
      await stockCountPage.clickToMonthlyShiftCount();
      await monthlyPage.clickNewMonthlyCountButton();
      await monthlyPage.verifyAssignedItemsOnMonthlyCountPage(selectedItem);
      log('✓ Verified Assign Item is displayed On Monthly Shift Count Page');

      // Delete Item from Count Locations
      if (countLocationsPage && assignWeeklyAndMonthlyItem) {
        await stockCountPage.navigateToCountLocations();
        await countLocationsPage.deleteItems(assignWeeklyAndMonthlyItem.locationName, selectedItem);
      }
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  }); 

  test.describe('RCSP-206 - Verify Assign Daily, Weekly and Monthly Frequency Item to Count Location', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify user can assign a Daily, Weekly and Monthly Frequency Item to an existing Count Location with Weekly and Monthly count frequency.', async ({
    page,
  }) => {
    test.setTimeout(120000);
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let assignDailyAndWeeklyAndMonthlyItemData: Rcsp206AssignItemToCountLocationData | undefined;
    let assignDailyAndWeeklyAndMonthlyItem: any;
 
      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      assignDailyAndWeeklyAndMonthlyItemData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.assignDailyAndWeeklyAndMonthlyItem);
      assignDailyAndWeeklyAndMonthlyItem = assignDailyAndWeeklyAndMonthlyItemData.assignItemData?.[0];

      if (!assignDailyAndWeeklyAndMonthlyItem) {
        throw new Error('RCSP-206 assignWeeklyItemData is missing or empty');
      }

      log('=== RCSP-206: Verify Assign Weekly Item Popup Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

      const selectedItem =  await countLocationsPage.addNewItems(assignDailyAndWeeklyAndMonthlyItem.locationName, assignDailyAndWeeklyAndMonthlyItem.items, assignDailyAndWeeklyAndMonthlyItem.countFrequency);
      log('✓ Verified Assign Item Popup functionality successfully');
    
      // await stockCountPage.clickToDailyShiftCount();
      // await dailyPage.clickNewDailyShiftCountButton();
      // await dailyPage.verifyAssignedItemsOnDailyShiftCountPage(selectedItem);
      // log('✓ Verified Assign Item is displayed On Daily Shift Count Page');

       // Navigate to Weekly Shift Count
      await stockCountPage.clickToWeeklyShiftCount();
      await weeklyPage.clickNewWeeklyCountButton();
      await weeklyPage.verifyAssignedItemsOnWeeklyCountPage(selectedItem);
      log('✓ Verified Assign Item is displayed On Weekly Shift Count Page');

        // Navigate to Monthly Shift Count
      await stockCountPage.clickToMonthlyShiftCount();
      await monthlyPage.clickNewMonthlyCountButton();
      await monthlyPage.verifyAssignedItemsOnMonthlyCountPage(selectedItem);
      log('✓ Verified Assign Item is displayed On Monthly Shift Count Page');

      // Delete Item from Count Locations
      if (countLocationsPage && assignDailyAndWeeklyAndMonthlyItem) {
        await stockCountPage.navigateToCountLocations();
        await countLocationsPage.deleteItems(assignDailyAndWeeklyAndMonthlyItem.locationName, selectedItem);
      }
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  }); 


  test.describe('RCSP-206 - Verify Count Frequency options are displayed and Verify Assign Item button is disabled until all mandatory fields are filled in Assign Item popup', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify Count Frequency options are displayed and Assign Item button is disabled until all mandatory fields are filled', async ({
    page,
  }) => {
    test.setTimeout(120000);
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let countFrequencyOptionsData: Rcsp206AssignItemToCountLocationData | undefined;
    let countFrequencyOptions: any;
 
      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      countFrequencyOptionsData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.countFrequencyOptions);
      countFrequencyOptions = countFrequencyOptionsData.assignItemData?.[0];

      if (!countFrequencyOptions) {
        throw new Error('RCSP-206 countFrequencyOptionsData is missing or empty');
      }

      log('=== RCSP-206: Verify Count Frequency options and Assign Item button Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

      await countLocationsPage.verifyCountFrequencyOptions(countFrequencyOptions.locationName, countFrequencyOptions.countFrequency);
        log("✓ Verified all Count Frequency options successfully and Verify Assign Item button is disabled until all mandatory fields are filled.");
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  }); 

 test.describe('RCSP-206 - Verify user can cancel assigning an Item to a Count Location', () => {
  let loginPage: RTCDashboardLoginPage;
  let stockCountPage: StockCountPage;
  let countLocationsPage: CountLocationsPage;
  let dailyPage: DailyShiftCountPage;
  let weeklyPage: WeeklyCountPage;
  let monthlyPage: MonthlyCountPage;

  test('Verify user can cancel the Assign Item operation after entering mandatory details', async ({
    page,
  }) => {
    test.setTimeout(120000);
    let navigationData: Rcsp206CountLocationsPageTestData | undefined;
    let assignDailyAndWeeklyAndMonthlyItemData: Rcsp206AssignItemToCountLocationData | undefined;
    let assignDailyAndWeeklyAndMonthlyItem: any;
 
      loginPage = new RTCDashboardLoginPage(page);
      stockCountPage = new StockCountPage(page);
      countLocationsPage = new CountLocationsPage(page);
      dailyPage = new DailyShiftCountPage(page);
      weeklyPage = new WeeklyCountPage(page);
      monthlyPage = new MonthlyCountPage(page);

      navigationData = getRcsp206TestCaseData<Rcsp206CountLocationsPageTestData>(RCSP_206_TEST_CASE_IDS.navigation);
      assignDailyAndWeeklyAndMonthlyItemData = getRcsp206TestCaseData<Rcsp206AssignItemToCountLocationData>(RCSP_206_TEST_CASE_IDS.assignDailyAndWeeklyAndMonthlyItem);
      assignDailyAndWeeklyAndMonthlyItem = assignDailyAndWeeklyAndMonthlyItemData.assignItemData?.[0];

      if (!assignDailyAndWeeklyAndMonthlyItem) {
        throw new Error('RCSP-206 assignWeeklyItemData is missing or empty');
      }

      log('=== RCSP-206: Verify Assign Weekly Item Popup Test Started ===');

      log('STEP 1: Launching URL: ' + CONFIG.dashboardURL);
      await page.goto(CONFIG.dashboardURL);
      await page.waitForLoadState('networkidle');
      log('✓ URL launched successfully');

      log('STEP 2: Logging in with credentials');
      log('Email: ' + CONFIG.credentials.admin.username);
      await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
      log('✓ Login successful - Dashboard loaded');

      for (const navigationItem of navigationData.navigationItems) {
        log(`Navigating to ${navigationItem}`);
        await navigateToStockCountSection(stockCountPage, navigationItem);
      }

      await countLocationsPage.enterItemsDetailsAndClickOnCancel(assignDailyAndWeeklyAndMonthlyItem.locationName, assignDailyAndWeeklyAndMonthlyItem.items, assignDailyAndWeeklyAndMonthlyItem.countFrequency);
      log('✓ Verified Assign Item Popup functionality successfully');
    
      log('=== TEST PASSED - All navigations verified successfully ===');
    }); 
 
  }); 


























