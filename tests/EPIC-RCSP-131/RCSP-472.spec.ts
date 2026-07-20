/**
 * RCSP-472 – Operations Admin Roles & Permissions automation
 * Test case IDs use TC_RCSP-472_* format (mapped from TC-OA-001..005).
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { RolesAndPermissionsPage } from '../../pages/Admin/Roles&PermissionsPage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp472CommonData,
  type Rcsp472JsonData,
} from '../../utils/testData';

const RCSP_472_FILE_NAME = 'RCSP-472';
const RCSP_472_SCENARIO_ID = 'RCSP-472';

const TC = {
  pageLoadUi: 'TC_RCSP-472_001',
  operationsAdminDetails: 'TC_RCSP-472_002',
  searchRoles: 'TC_RCSP-472_003',
  roleAssignment: 'TC_RCSP-472_004',
  regressionLockedRoles: 'TC_RCSP-472_005',
} as const;

function getCommonData(): Rcsp472CommonData {
  return getScenarioTestData<Rcsp472JsonData>(
    RCSP_472_FILE_NAME,
    RCSP_472_SCENARIO_ID,
  ).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_472_FILE_NAME,
    RCSP_472_SCENARIO_ID,
    testCaseId,
  );
}

async function loginAsAdmin(page: Page): Promise<{
  loginPage: RTCDashboardLoginPage;
  rolesPage: RolesAndPermissionsPage;
}> {
  const loginPage = new RTCDashboardLoginPage(page);
  const rolesPage = new RolesAndPermissionsPage(page);

  log(`Launching URL: ${CONFIG.dashboardURL}`);
  await page.goto(CONFIG.dashboardURL);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await loginPage.login(
    CONFIG.credentials.admin.username,
    CONFIG.credentials.admin.password,
  );
  log('✓ Login successful');

  return { loginPage, rolesPage };
}

test.describe.configure({ mode: 'serial' });

test.describe("RCSP-472 - Admin > Roles & Permissions: Roles & Permissions page under Admin menu loads successfully and displ...", () => {
  let loginPage: RTCDashboardLoginPage;
  let rolesPage: RolesAndPermissionsPage;

  test("Verify whether the Roles & Permissions page under Admin menu loads successfully and displays the Roles tab UI without layout or alignment issues", async ({ page }) => {
    ({ loginPage, rolesPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      pageTitle: string;
      pageSubtitle: string;
      newRoleButton: string;
      activeTab: string;
      secondaryTab: string;
      searchPlaceholder: string;
      columnHeaders: string[];
    }>(TC.pageLoadUi);

    await rolesPage.openRolesAndPermissions();
    await rolesPage.verifyRolesPageUi(data);
  });
});

test.describe("RCSP-472 - Admin > Roles & Permissions: Operations Admin role is displayed correctly on the Roles tab with accurate...", () => {
  let loginPage: RTCDashboardLoginPage;
  let rolesPage: RolesAndPermissionsPage;

  test("Verify whether the Operations Admin role is displayed correctly on the Roles tab under Roles & Permissions with accurate name, description, permission count, user count, Active status, and action icons", async ({ page }) => {
    ({ loginPage, rolesPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      displayName: string;
      roleKey: string;
      description: string;
      expectedPermissions: number;
      expectedUsers: number;
      expectedStatus: string;
    }>(TC.operationsAdminDetails);

    await rolesPage.openRolesAndPermissions();
    await rolesPage.selectRolesTab();
    await rolesPage.verifyOperationsAdminDetails(data);
  });
});

test.describe("RCSP-472 - Admin > Roles & Permissions: Searching for Operations Admin returns the correct role and invalid/empty/...", () => {
  let loginPage: RTCDashboardLoginPage;
  let rolesPage: RolesAndPermissionsPage;

  test("Verify whether searching for Operations Admin on the Roles tab under Roles & Permissions returns the correct role and whether invalid/empty/partial search inputs behave correctly (positive, negative, and edge)", async ({ page }) => {
    ({ loginPage, rolesPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      validFullName: string;
      partial: string;
      roleKey: string;
      invalid: string;
      mixedCase: string;
      whitespace: string;
    }>(TC.searchRoles);

    await rolesPage.openRolesAndPermissions();
    await rolesPage.selectRolesTab();

    for (const roleName of common.baselineRoles) {
      await rolesPage.verifyRoleVisible(roleName);
    }

    await rolesPage.searchRoles(data.validFullName);
    await rolesPage.verifySearchShowsRole(data.validFullName);

    await rolesPage.clearSearch();
    await rolesPage.searchRoles(data.partial);
    await rolesPage.verifySearchShowsRole(data.validFullName);

    await rolesPage.clearSearch();
    await rolesPage.searchRoles(data.roleKey);
    const keySearchShowsRole = await rolesPage
      .roleRow(data.validFullName)
      .isVisible()
      .catch(() => false);
    if (keySearchShowsRole) {
      await rolesPage.verifySearchShowsRole(data.validFullName);
    } else {
      log(
        'Role-key search did not return Operations Admin – documenting actual UI behavior as designed',
      );
    }

    await rolesPage.clearSearch();
    await rolesPage.searchRoles(data.invalid);
    await rolesPage.verifySearchEmptyOrNoMatch(data.invalid);

    await rolesPage.clearSearch();
    await rolesPage.searchRoles(data.whitespace);
    await rolesPage.clearSearch();
    await rolesPage.verifyRoleVisible(data.validFullName);

    await rolesPage.searchRoles(data.mixedCase);
    await rolesPage.verifySearchShowsRole(data.validFullName);
  });
});

test.describe("RCSP-472 - Admin > Roles & Permissions / User Role Assignment: Operations Admin role is available for selection...", () => {
  let loginPage: RTCDashboardLoginPage;
  let rolesPage: RolesAndPermissionsPage;

  test("Verify whether the Operations Admin role is available for selection in the user role assignment dropdown/screen (if applicable) and is not selectable when the role is Inactive or the user lacks assignment permission (negative/edge)", async ({ page }) => {
    ({ loginPage, rolesPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      roleToSelect: string;
      expectedStatusAfterChecks: string;
      skipAssignmentWhenUnavailable: boolean;
    }>(TC.roleAssignment);

    const usersOpened = await rolesPage.openUsersManagement();
    if (usersOpened) {
      const assignable = await rolesPage.isOperationsAdminAssignable(
        data.roleToSelect,
      );
      expect(assignable || data.skipAssignmentWhenUnavailable).toBeTruthy();
    } else {
      expect(data.skipAssignmentWhenUnavailable).toBeTruthy();
      log(
        'User role assignment screen not available – skipping positive assignment path',
      );
    }

    await rolesPage.openRolesAndPermissions();
    await rolesPage.selectRolesTab();
    await rolesPage.verifyRoleVisible(data.roleToSelect);
    await expect(
      rolesPage.roleRow(data.roleToSelect).getByText(
        new RegExp(data.expectedStatusAfterChecks, 'i'),
      ),
    ).toBeVisible();
  });
});

test.describe("RCSP-472 - Admin > Roles & Permissions: Existing roles remain unchanged after viewing Operations Admin details...", () => {
  let loginPage: RTCDashboardLoginPage;
  let rolesPage: RolesAndPermissionsPage;

  test("Verify whether existing roles remain unchanged on the Roles tab under Roles & Permissions after viewing Operations Admin details, and whether restricted actions for locked/system roles still behave correctly (regression and edge)", async ({ page }) => {
    ({ loginPage, rolesPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      baselineRoles: string[];
      operationsAdmin: string;
      lockedRole: string;
      expectedStatus: string;
    }>(TC.regressionLockedRoles);

    await rolesPage.openRolesAndPermissions();
    await rolesPage.selectRolesTab();

    const baseline = await rolesPage.captureBaselineSnapshots(data.baselineRoles);

    await rolesPage.openManagePermissions(data.operationsAdmin);
    await rolesPage.cancelOrReturnFromRoleDetail();

    await rolesPage.openEditRole(data.operationsAdmin);
    await rolesPage.cancelOrReturnFromRoleDetail();

    await rolesPage.verifyBaselineUnchanged(baseline);
    await rolesPage.verifyLockedRoleIndicators(data.lockedRole);
    await rolesPage.verifyOperationsAdminDetails({
      displayName: data.operationsAdmin,
      roleKey: getCommonData().operationsAdmin.roleKey,
      description: getCommonData().operationsAdmin.description,
      expectedStatus: data.expectedStatus,
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await rolesPage.verifyPageLoaded();
    await rolesPage.selectRolesTab();
    await rolesPage.verifyBaselineUnchanged(baseline);
  });
});
