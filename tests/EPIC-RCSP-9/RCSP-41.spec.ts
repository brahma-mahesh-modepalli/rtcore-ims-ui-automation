/**
 * RCSP-41 - Wastage / Log Waste
 * Test case IDs use TC_RCSP-41_* format.
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { LogWastePage, type WasteLineInput } from '../../pages/Wastage/LogWastePage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
	getScenarioTestCaseData,
	getScenarioTestData,
	type Rcsp41CommonData,
	type Rcsp41JsonData,
} from '../../utils/testData';

const RCSP_41_FILE_NAME = 'RCSP-41';
const RCSP_41_SCENARIO_ID = 'RCSP-41';

const TC = {
	tc01: 'TC_RCSP-41_001',
	tc02: 'TC_RCSP-41_002',
	tc03: 'TC_RCSP-41_003',
	tc04: 'TC_RCSP-41_004',
	tc05: 'TC_RCSP-41_005',
	tc06: 'TC_RCSP-41_006',
	tc07: 'TC_RCSP-41_007',
	tc08: 'TC_RCSP-41_008',
	tc09: 'TC_RCSP-41_009',
	tc10: 'TC_RCSP-41_010',
} as const;

function getCommonData(): Rcsp41CommonData {
	return getScenarioTestData<Rcsp41JsonData>(
		RCSP_41_FILE_NAME,
		RCSP_41_SCENARIO_ID,
	).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
	return getScenarioTestCaseData<T>(
		RCSP_41_FILE_NAME,
		RCSP_41_SCENARIO_ID,
		testCaseId,
	);
}

async function prepare(page: Page) {
	const common = getCommonData();
	const loginPage = new RTCDashboardLoginPage(page);
	const logWastePage = new LogWastePage(page);
	const transfersPage = new TransfersPage(page);

	await page.goto(CONFIG.dashboardURL);
	await loginPage.login(
		CONFIG.credentials.admin.username,
		CONFIG.credentials.admin.password,
	);
	await transfersPage.switchStore(
		common.hierarchy.region,
		common.hierarchy.market,
		common.hierarchy.store,
	);
	await logWastePage.openLogWaste();

	return { common, loginPage, logWastePage, transfersPage };
}

function itemLine(
	common: Rcsp41CommonData,
	overrides: Partial<WasteLineInput> = {},
): WasteLineInput {
	return {
		type: common.itemEntry.type,
		item: common.itemEntry.item,
		sku: common.itemEntry.sku,
		reason: common.itemEntry.reason,
		uom: common.itemEntry.uom,
		quantity: common.itemEntry.quantity,
		notes: common.itemEntry.notes,
		...overrides,
	};
}

function recipeLine(
	common: Rcsp41CommonData,
	overrides: Partial<WasteLineInput> = {},
): WasteLineInput {
	return {
		type: common.recipeEntry.type,
		recipe: common.recipeEntry.recipe,
		reason: common.recipeEntry.reason,
		uom: common.recipeEntry.uom,
		quantity: common.recipeEntry.quantity,
		notes: common.recipeEntry.notes,
		...overrides,
	};
}

async function createEditableLog(logWastePage: LogWastePage, shift: string) {
	await logWastePage.createWasteLog(shift);
	await logWastePage.verifyWasteLogDetailLoaded();
}

test.describe.configure({ mode: 'serial' });

test('TC_RCSP-41_001 - Waste Logs page chrome', async ({ page }) => {
	const common = getCommonData();
	const testData = getCaseData<{ expectedPageTitle: string; expectedPageDescription: string; expectedPrimaryButton: string }>(TC.tc01);
	const { logWastePage } = await prepare(page);

	await logWastePage.verifyListingChrome({
		expectedPageTitle: testData.expectedPageTitle,
		expectedPageDescription: testData.expectedPageDescription,
		expectedPrimaryButton: testData.expectedPrimaryButton,
		columnHeaders: common.columnHeaders,
	});
});

test('TC_RCSP-41_002 - Create modal shift options and cancel/create behavior', async ({ page }) => {
	const common = getCommonData();
	const testData = getCaseData<{ shift: string; shiftOptions: string[] }>(TC.tc02);
	const { logWastePage } = await prepare(page);

	await logWastePage.openLogWasteModal();
	const actualOptions = await logWastePage.getShiftOptions();
	for (const option of testData.shiftOptions) {
		expect(actualOptions.some((value) => value.toLowerCase() === option.toLowerCase())).toBeTruthy();
	}
	await logWastePage.cancelLogWasteModal();
	await createEditableLog(logWastePage, testData.shift || common.defaultShift);
});

test('TC_RCSP-41_003 - Save an ITEM waste line', async ({ page }) => {
	const common = getCommonData();
	const { logWastePage } = await prepare(page);

	await createEditableLog(logWastePage, common.defaultShift);
	await logWastePage.fillWasteLine(itemLine(common));
	await logWastePage.saveWasteLog();
	await logWastePage.verifySavedLineEditable();
});

test('TC_RCSP-41_004 - Save a RECIPE waste line', async ({ page }) => {
	const common = getCommonData();
	const { logWastePage } = await prepare(page);

	await createEditableLog(logWastePage, common.defaultShift);
	await logWastePage.fillWasteLine(recipeLine(common));
	await logWastePage.saveWasteLog();
	await logWastePage.verifySavedLineEditable();
});

test('TC_RCSP-41_005 - Block save when mandatory fields are missing', async ({ page }) => {
	const common = getCommonData();
	const testData = getCaseData<{ validationPattern: string }>(TC.tc05);
	const { logWastePage } = await prepare(page);

	await createEditableLog(logWastePage, common.defaultShift);
	await logWastePage.saveWasteLog();
	await logWastePage.verifyValidationVisible(new RegExp(testData.validationPattern, 'i'));
});

test('TC_RCSP-41_006 - Lock a saved waste log', async ({ page }) => {
	const common = getCommonData();
	const { logWastePage } = await prepare(page);

	await createEditableLog(logWastePage, common.defaultShift);
	await logWastePage.fillWasteLine(itemLine(common));
	await logWastePage.saveWasteLog();
	await logWastePage.lockWasteLog();
	await logWastePage.verifyLockedState();
});

test('TC_RCSP-41_007 - Apply a locked waste log and prevent duplicate apply', async ({ page }) => {
	const common = getCommonData();
	const { logWastePage } = await prepare(page);

	await createEditableLog(logWastePage, common.defaultShift);
	await logWastePage.fillWasteLine(itemLine(common));
	await logWastePage.saveWasteLog();
	await logWastePage.lockWasteLog();
	await logWastePage.applyToStock(true);
	await logWastePage.verifyDuplicateApplyBlocked();
});

test('TC_RCSP-41_008 - Save, lock, and apply ITEM and RECIPE rows', async ({ page }) => {
	const common = getCommonData();
	const testData = getCaseData<{ row1: Record<string, string>; row2: Record<string, string> }>(TC.tc08);
	const { logWastePage } = await prepare(page);

	await createEditableLog(logWastePage, common.defaultShift);
	await logWastePage.fillWasteLine(itemLine(common, testData.row1));
	await logWastePage.addRow();
	await logWastePage.fillWasteLine(recipeLine(common, testData.row2));
	await logWastePage.saveWasteLog();
	await logWastePage.lockWasteLog();
	await logWastePage.applyToStock(true);
});

test('TC_RCSP-41_009 - Verify reasons and quantity/notes edge values', async ({ page }) => {
	const common = getCommonData();
	const testData = getCaseData<{
		expectedReasons: string[];
		decimalQuantity: string;
		largeQuantity: string;
		notesSpecial: string;
	}>(TC.tc09);
	const { logWastePage } = await prepare(page);

	await createEditableLog(logWastePage, common.defaultShift);
	await logWastePage.selectWasteCategory('Raw Waste');
	const reasons = await logWastePage.getReasonOptions();
	for (const expectedReason of testData.expectedReasons) {
		expect(reasons.some((reason) => reason.toLowerCase().includes(expectedReason.toLowerCase()))).toBeTruthy();
	}
	await logWastePage.fillWasteLine(itemLine(common, {
		quantity: testData.decimalQuantity,
		notes: testData.notesSpecial,
	}));
	await logWastePage.saveWasteLog();
	await expect(logWastePage.lockButton.or(page.getByText(/required|invalid|must|error/i).first())).toBeVisible();

	await logWastePage.fillQuantity(testData.largeQuantity);
	await logWastePage.saveWasteLog();
	await expect(logWastePage.lockButton.or(page.getByText(/required|invalid|must|error/i).first())).toBeVisible();
});

test('TC_RCSP-41_010 - Block unauthorized access when credentials are configured', async ({ page }) => {
	const common = getCommonData();
	const unauthorized = common.unauthorizedUser;
	test.skip(!unauthorized.username || !unauthorized.password, unauthorized.note);

	const loginPage = new RTCDashboardLoginPage(page);
	const logWastePage = new LogWastePage(page);
	await page.goto(CONFIG.dashboardURL);
	await loginPage.login(unauthorized.username, unauthorized.password);
	await logWastePage.verifyWastageAccessUnavailable();
});
