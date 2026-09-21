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

test.describe('RCSP-718 - Food Cost dashboard validation', () => {
	test.setTimeout(90_000);

	test('TC_RCSP-718_001 - Food Cost dashboard is displayed', { tag: ['@smoke', '@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyLoaded();
	});

	test('TC_RCSP-718_002 - Food Cost dashboard widgets are visible', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyWidgetsRendered();
	});

	test('TC_RCSP-718_003 - Food Cost dashboard contains no loading or application errors', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyNoWidgetErrors();
		await foodCostPage.verifyLoaded();
	});

	test('TC_RCSP-718_004 - Forecasted Food Cost displays a value and percentage', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyMetricValueAndPercent(/forecasted food cost/i);
	});

	test('TC_RCSP-718_005 - Actual Food Cost displays a value and percentage', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyMetricValueAndPercent(/actual food cost/i);
	});

	test('TC_RCSP-718_006 - Total Waste displays a value and percentage', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyMetricValueAndPercent(/total waste/i);
	});

	test('TC_RCSP-718_007 - Gross Projected Food Cost is prominently displayed', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyProminentLabel(/gross projected food cost|projected food cost/i);
	});

	test('TC_RCSP-718_008 - Theoretical and Actual percentages are clearly labeled', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyLabelsVisible([/theoretical/i, /actual/i]);
	});

	test('TC_RCSP-718_009 - Food Cost values are displayed with Net Sales', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyLabelsVisible([/net sales/i, /food cost/i]);
	});

	test('TC_RCSP-718_010 - AT Variance calculation shows dynamic values', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyVarianceCalculationSection([/at variance/i, /theoretical/i, /actual/i]);
	});

	test('TC_RCSP-718_011 - PT Variance calculation shows dynamic values', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyVarianceCalculationSection([/pt variance/i, /theoretical/i, /actual/i]);
	});

	test('TC_RCSP-718_012 - Actual Food Cost breakdown is displayed near the top of the page', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyBreakdownSectionAtTop(/actual food cost\s*-?\s*breakdown/i);
	});

	test('TC_RCSP-718_013 - Positive Food Cost variance does not show a plus prefix', { tag: ['@regression'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyPositiveMetricFormatting(/variance/i);
	});

	test('TC_RCSP-718_014 - Positive PT Variance does not show a plus prefix', { tag: ['@regression'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyPositiveMetricFormatting(/pt variance/i);
	});

	test('TC_RCSP-718_015 - Positive AT Variance does not show a plus prefix', { tag: ['@regression'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyPositiveMetricFormatting(/at variance/i);
	});
});
