/**
 * RCSP-110 - Inventory Setup catalog pages
 * Test case IDs: TC_RCSP-110_01 ... TC_RCSP-110_07.
 */

import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
	InventorySetupCatalogPage,
	type Catalog,
} from '../../pages/Inventory Setup/InventorySetupCatalogPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-110';
const SCENARIO_ID = 'RCSP-110';

const TC = {
	navigation: 'TC_RCSP-110_01',
	menuData: 'TC_RCSP-110_02',
	recipeChrome: 'TC_RCSP-110_03',
	recipeData: 'TC_RCSP-110_04',
	recipeIngredients: 'TC_RCSP-110_05',
	masterChrome: 'TC_RCSP-110_06',
	masterData: 'TC_RCSP-110_07',
} as const;

function getCaseData<T>(testCaseId: string): T {
	return getScenarioTestCaseData<T>(FILE_NAME, SCENARIO_ID, testCaseId);
}

function getHierarchy(): { region: string; market: string; store: string } {
	return getScenarioTestData<{
		commonData: { hierarchy: { region: string; market: string; store: string } };
	}>(FILE_NAME, SCENARIO_ID).commonData.hierarchy;
}

test.describe('RCSP-110 - Inventory Setup catalog pages', () => {
	test.setTimeout(90000);

	let catalogPage: InventorySetupCatalogPage;

	test.beforeEach(async ({ page }) => {
		const loginPage = new RTCDashboardLoginPage(page);
		const transfersPage = new TransfersPage(page);
		catalogPage = new InventorySetupCatalogPage(page);

		await page.goto(CONFIG.dashboardURL);
		await page.waitForLoadState('networkidle').catch(() => undefined);
		await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);

		const hierarchy = getHierarchy();
		await transfersPage.switchStore(hierarchy.region, hierarchy.market, hierarchy.store);
	});

	test('TC_RCSP-110_02 - Menu Items data is aligned under the correct columns', { tag: ['@functional'] }, async () => {
		getCaseData(TC.menuData);
		await catalogPage.navigate('menuItems');
		await catalogPage.verifyHasDataRow();
		await catalogPage.verifyRowsHaveValues();
	});

	test('TC_RCSP-110_03 - Recipes page UI and table headers', { tag: ['@smoke', '@sanity', '@functional'] }, async () => {
		getCaseData(TC.recipeChrome);
		await catalogPage.navigate('recipes');
		await catalogPage.verifyPage('recipes');
	});

	test('TC_RCSP-110_04 - Recipe data is aligned under the correct columns', { tag: ['@functional'] }, async () => {
		getCaseData(TC.recipeData);
		await catalogPage.navigate('recipes');
		await catalogPage.verifyHasDataRow();
		await catalogPage.verifyRowsHaveValues();
	});

	test('TC_RCSP-110_05 - Selecting a recipe displays mapped ingredients', { tag: ['@functional'] }, async () => {
		getCaseData(TC.recipeIngredients);
		await catalogPage.navigate('recipes');
		await catalogPage.selectFirstRecipe();
		await catalogPage.verifyRecipeIngredientsDisplayed();
	});

	test('TC_RCSP-110_06 - Master Items page UI and table headers', { tag: ['@smoke', '@sanity', '@functional'] }, async () => {
		getCaseData(TC.masterChrome);
		await catalogPage.navigate('masterItems');
		await catalogPage.verifyPage('masterItems');
	});

	test('TC_RCSP-110_07 - Master Item data is aligned under the correct columns', { tag: ['@functional'] }, async () => {
		getCaseData(TC.masterData);
		await catalogPage.navigate('masterItems');
		await catalogPage.verifyHasDataRow();
		await catalogPage.verifyRowsHaveValues();
	});

	test('TC_RCSP-110_01 - Navigation between Menu Items, Recipes, and Master Items', { tag: ['@regression'] }, async () => {
		getCaseData(TC.navigation);
		const pages: Array<[Catalog, RegExp]> = [
			['menuItems', /menu items?/i],
			['recipes', /recipes?/i],
			['masterItems', /master items?/i],
		];

		for (const [catalog, heading] of pages) {
			await catalogPage.navigate(catalog);
			await expect(catalogPage.pageTitle).toHaveText(heading);
			await catalogPage.verifyHeaders(catalog);
		}
	});
});
