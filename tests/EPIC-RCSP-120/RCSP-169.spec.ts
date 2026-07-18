/**
 * RCSP-169 – Credit Requests rename automation
 * Test case IDs use TC_RCSP-169_* format.
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { CreditRequestsPage } from '../../pages/Ordering/CreditRequestsPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp169CommonData,
  type Rcsp169JsonData,
} from '../../utils/testData';

const RCSP_169_FILE_NAME = 'RCSP-169';
const RCSP_169_SCENARIO_ID = 'RCSP-169';

const TC = {
  menuAndPageLanding: 'TC_RCSP-169_001',
  listingCtaAndSummary: 'TC_RCSP-169_002',
  gridTerminology: 'TC_RCSP-169_003',
  unauthorizedAccess: 'TC_RCSP-169_004',
  labelPersistence: 'TC_RCSP-169_005',
} as const;

function getCommonData(): Rcsp169CommonData {
  return getScenarioTestData<Rcsp169JsonData>(
    RCSP_169_FILE_NAME,
    RCSP_169_SCENARIO_ID,
  ).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_169_FILE_NAME,
    RCSP_169_SCENARIO_ID,
    testCaseId,
  );
}

async function loginAs(
  page: Page,
  username: string,
  password: string,
): Promise<{
  loginPage: RTCDashboardLoginPage;
  creditRequestsPage: CreditRequestsPage;
  transfersPage: TransfersPage;
}> {
  const loginPage = new RTCDashboardLoginPage(page);
  const creditRequestsPage = new CreditRequestsPage(page);
  const transfersPage = new TransfersPage(page);

  log(`Launching URL: ${CONFIG.dashboardURL}`);
  await page.goto(CONFIG.dashboardURL);
  await page.waitForLoadState('domcontentloaded');
  await loginPage.login(username, password);
  return { loginPage, creditRequestsPage, transfersPage };
}

async function loginAsAdmin(page: Page) {
  return loginAs(
    page,
    CONFIG.credentials.admin.username,
    CONFIG.credentials.admin.password,
  );
}

async function ensureStoreSelected(
  transfersPage: TransfersPage,
  region: string,
  market: string,
  store: string,
): Promise<void> {
  await transfersPage.switchStore(region, market, store);
}

test.describe.configure({ mode: 'serial' });

test.describe('RCSP-169 - Ordering: Credit Requests submenu and page landing content', () => {
  test('Verify whether Ordering submenu shows Credit Requests (not Credit Memos) and opens Credit Requests page with correct title and description', async ({
    page,
  }) => {
    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      expectedMenuLabel: string;
      forbiddenMenuLabel: string;
      expectedPageTitle: string;
      expectedPageDescription: string;
    }>(TC.menuAndPageLanding);

    const { creditRequestsPage, transfersPage } = await loginAsAdmin(page);
    await ensureStoreSelected(
      transfersPage,
      common.hierarchy.region,
      common.hierarchy.market,
      data.store || common.hierarchy.store,
    );

    await creditRequestsPage.verifyOrderingShowsCreditRequestsNotMemos();
    await creditRequestsPage.openCreditRequests();
    await expect(creditRequestsPage.pageTitle).toContainText(
      new RegExp(data.expectedPageTitle, 'i'),
    );
    await expect(creditRequestsPage.pageDescription).toContainText(
      new RegExp(data.expectedPageDescription.replace(/\./g, '\\.?'), 'i'),
    );
  });
});

test.describe('RCSP-169 - Ordering: Credit Requests listing CTA, summary cards, and tabs', () => {
  test('Verify whether Credit Requests listing shows + NEW CREDIT REQUEST, Draft Claim Value / Submitted cards, and All/Draft/Submitted tabs without Credit Memo CTA wording', async ({
    page,
  }) => {
    const common = getCommonData();
    const data = getCaseData<{
      expectedPrimaryButton: string;
      forbiddenPrimaryButton: string;
      summaryCards: string[];
      statusTabs: string[];
    }>(TC.listingCtaAndSummary);

    const { creditRequestsPage, transfersPage } = await loginAsAdmin(page);
    await ensureStoreSelected(
      transfersPage,
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.store,
    );
    await creditRequestsPage.openCreditRequests();
    await creditRequestsPage.verifyListingPrimaryCtaAndSummary(data);
  });
});

test.describe('RCSP-169 - Ordering: Credit Requests grid terminology vs technical ID format', () => {
  test('Verify whether user-facing labels use Credit Request(s) while MEMO # / CM- IDs are treated as accepted technical format or preferred renamed headers', async ({
    page,
  }) => {
    const common = getCommonData();
    const data = getCaseData<{
      statusTab: string;
      expectedPageTitle: string;
      expectedPrimaryButton: string;
      acceptedIdPattern: string;
      preferredIdColumnHeaders: string[];
      legacyIdColumnHeader: string;
    }>(TC.gridTerminology);

    const { creditRequestsPage, transfersPage } = await loginAsAdmin(page);
    await ensureStoreSelected(
      transfersPage,
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.store,
    );
    await creditRequestsPage.openCreditRequests();
    await creditRequestsPage.selectStatusTab(data.statusTab);
    await creditRequestsPage.verifyUserFacingRenameAndIdFormat(data);
  });
});

test.describe('RCSP-169 - Ordering: Unauthorized users cannot access Credit Requests', () => {
  test('Verify whether unauthorized users cannot see/open Credit Requests or Credit Memos, while authorized users can open Credit Requests only', async ({
    page,
  }) => {
    const common = getCommonData();
    const data = getCaseData<{
      legacyRoute: string;
      authorizedExpectedMenuLabel: string;
      forbiddenMenuLabel: string;
    }>(TC.unauthorizedAccess);

    test.skip(
      !common.unauthorizedUser.username || !common.unauthorizedUser.password,
      'Set commonData.unauthorizedUser credentials in RCSP-169.json to enable this test',
    );

    const unauthorized = await loginAs(
      page,
      common.unauthorizedUser.username,
      common.unauthorizedUser.password,
    );
    await unauthorized.creditRequestsPage.verifyCreditAccessUnavailable();
    await unauthorized.creditRequestsPage.attemptLegacyRouteAccess(data.legacyRoute);

    await page.goto(CONFIG.loginURL);
    const authorized = await loginAsAdmin(page);
    await ensureStoreSelected(
      authorized.transfersPage,
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.store,
    );
    await authorized.creditRequestsPage.verifyOrderingShowsCreditRequestsNotMemos();
    await authorized.creditRequestsPage.openCreditRequests();
  });
});

test.describe('RCSP-169 - Ordering: Credit Requests rename persists after refresh and re-navigation', () => {
  test('Verify whether Credit Requests / + NEW CREDIT REQUEST labels remain after Ordering collapse/expand, refresh, and leave/return even if URL keeps credit-memos', async ({
    page,
  }) => {
    const common = getCommonData();
    const data = getCaseData<{
      expectedMenuLabel: string;
      expectedPageTitle: string;
      expectedPrimaryButton: string;
      forbiddenLabels: string[];
      alternateOrderingItem: string;
      legacyUrlSegment: string;
    }>(TC.labelPersistence);

    const { creditRequestsPage, transfersPage } = await loginAsAdmin(page);
    await ensureStoreSelected(
      transfersPage,
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.store,
    );
    await creditRequestsPage.openCreditRequests();
    await creditRequestsPage.verifyRenameLabelsPersist(data);

    const urlBefore = await creditRequestsPage.getCurrentUrl();
    log(`Current Credit Requests URL: ${urlBefore}`);

    await creditRequestsPage.collapseOrdering();
    await creditRequestsPage.expandOrdering();
    await creditRequestsPage.verifyRenameLabelsPersist(data);

    await creditRequestsPage.refreshPage();
    await creditRequestsPage.verifyCreditRequestsPageLoaded();
    await creditRequestsPage.verifyRenameLabelsPersist(data);

    await creditRequestsPage.openOrderHistory();
    await creditRequestsPage.openCreditRequests();
    await creditRequestsPage.verifyRenameLabelsPersist(data);

    const urlAfter = await creditRequestsPage.getCurrentUrl();
    if (new RegExp(data.legacyUrlSegment, 'i').test(urlAfter)) {
      log(
        `Legacy URL segment "${data.legacyUrlSegment}" still present; UI labels remain renamed`,
      );
    }
    expect(urlAfter.length).toBeGreaterThan(0);
  });
});
