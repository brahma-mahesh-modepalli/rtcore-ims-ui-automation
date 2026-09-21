import { test, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { FoodCostPage } from '../../pages/Food Cost/FoodCostPage';

async function openFoodCost(page: Page): Promise<FoodCostPage> {
	const loginPage = new RTCDashboardLoginPage(page);
	const foodCostPage = new FoodCostPage(page);

	await page.goto(CONFIG.dashboardURL);
	await page.waitForLoadState('networkidle').catch(() => undefined);
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	await foodCostPage.open();
	return foodCostPage;
}

test.describe('RCSP-820 - Food Cost dashboard widgets', () => {
	test.setTimeout(90_000);

	test('TC_RCSP-820_001 - Food Cost dashboard opens successfully', { tag: ['@smoke', '@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyLoaded();
	});

	test('TC_RCSP-820_002 - Food Cost dashboard widgets are rendered', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyWidgetsRendered();
	});

	test('TC_RCSP-820_003 - Food Cost dashboard does not show widget load errors', { tag: ['@regression'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyNoWidgetErrors();
	});

	test('TC_RCSP-820_004 - Forecasted Food Cost shows value and percentage', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyMetricValueAndPercent(/forecasted food cost/i);
	});

	test('TC_RCSP-820_005 - Actual Food Cost shows value and percentage', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyMetricValueAndPercent(/actual food cost/i);
	});

	test('TC_RCSP-820_006 - Total Waste shows value and percentage', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyMetricValueAndPercent(/total waste/i);
	});

	test('TC_RCSP-820_007 - Gross Projected Food Cost is prominently displayed', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyProminentLabel(/gross projected food cost|projected food cost/i);
	});

	test('TC_RCSP-820_008 - Theoretical and Actual percentages are clearly labeled', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyLabelsVisible([/theoretical/i, /actual/i]);
	});

	test('TC_RCSP-820_009 - Food Cost values are displayed alongside Net Sales', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyLabelsVisible([/net sales/i, /food cost/i]);
	});

	test('TC_RCSP-820_010 - AT Variance calculation is displayed with dynamic values', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyVarianceCalculationSection([/at variance/i, /theoretical/i, /actual/i]);
	});

	test('TC_RCSP-820_011 - PT Variance calculation is displayed with dynamic values', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyVarianceCalculationSection([/pt variance/i, /theoretical/i, /actual/i]);
	});

	test('TC_RCSP-820_012 - Actual Food Cost breakdown section is positioned near the top', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyBreakdownSectionAtTop(/actual food cost\s*-?\s*breakdown/i);
	});

	test('TC_RCSP-820_013 - Positive Variance does not show a plus prefix', { tag: ['@regression'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyPositiveMetricFormatting(/variance/i);
	});

	test('TC_RCSP-820_014 - Positive PT Variance does not show a plus prefix', { tag: ['@regression'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyPositiveMetricFormatting(/pt variance/i);
	});

	test('TC_RCSP-820_015 - Positive AT Variance does not show a plus prefix', { tag: ['@regression'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyPositiveMetricFormatting(/at variance/i);
	});
});
