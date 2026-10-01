import { test, expect, type Page } from '@playwright/test';
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
	await foodCostPage.verifyLoaded();
	return foodCostPage;
}

function dateDaysAgo(daysAgo: number): string {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return date.toISOString().slice(0, 10);
}

async function verifyActualFoodCostFormula(foodCostPage: FoodCostPage): Promise<void> {
	const values = await foodCostPage.getActualFoodCostBreakdownAmounts();
	const actualFoodCost = await foodCostPage.getDisplayedAmount(/^actual food cost$/i);
	const expected = values.theoretical + values.waste + values.varianceStatLoss + values.condimentUsage;
	expect(actualFoodCost).toBeCloseTo(expected, 2);
	await foodCostPage.verifyPriceDifferentialAbsent();
}

test.describe('RCSP-324 - Food Cost calculation update', () => {
	test.setTimeout(90_000);

	test('TC_RCSP-324_01 - dashboard loads with date controls and expected sections', { tag: ['@smoke', '@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyDateRangeControls();
		await foodCostPage.verifyBreakdownComponents();
		await foodCostPage.verifyWasteSection(/waste by reason/i, [/^reason$/i, /^value$/i, /^count$/i]);
		await foodCostPage.verifyWasteSection(/top waste items/i, [/^item$/i, /waste value/i, /^qty$/i]);
	});

	test('TC_RCSP-324_02 - Price Differential tile is absent', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyPriceDifferentialAbsent();
	});

	test('TC_RCSP-324_03 - breakdown does not contain Price Differential', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await expect(foodCostPage.mainContent.getByText(/actual food cost\s*-?\s*breakdown/i).first()).toBeVisible();
		await foodCostPage.verifyPriceDifferentialAbsent();
	});

	test('TC_RCSP-324_04 - breakdown displays the updated formula caption', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyBreakdownCaption();
	});

	test('TC_RCSP-324_05 - breakdown contains all required components', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyBreakdownComponents();
	});

	test('TC_RCSP-324_06 - Actual Food Cost matches the updated formula', { tag: ['@functional'] }, async ({ page }) => {
		await verifyActualFoodCostFormula(await openFoodCost(page));
	});

	test('TC_RCSP-324_07 - A/T Variance equals Actual minus Theoretical Food Cost', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		const actual = await foodCostPage.getDisplayedAmount(/^actual food cost$/i);
		const theoretical = await foodCostPage.getDisplayedAmount(/theoretical food cost/i);
		const variance = await foodCostPage.getDisplayedAmount(/a\s*\/\s*t variance/i);
		expect(variance).toBeCloseTo(actual - theoretical, 2);
	});

	test('TC_RCSP-324_08 - breakdown Total matches the updated formula', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		const values = await foodCostPage.getActualFoodCostBreakdownAmounts();
		expect(values.total).toBeCloseTo(
			values.theoretical + values.waste + values.varianceStatLoss + values.condimentUsage,
			2,
		);
	});

	test('TC_RCSP-324_09 - dashboard contains no Price Differential reference', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyPriceDifferentialAbsent();
	});

	test('TC_RCSP-324_10 - Waste by Reason remains available', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyWasteSection(
			/waste by reason/i,
			[/^reason$/i, /^value$/i, /^count$/i],
		);
	});

	test('TC_RCSP-324_11 - Top Waste Items remains available', { tag: ['@functional'] }, async ({ page }) => {
		await (await openFoodCost(page)).verifyWasteSection(
			/top waste items/i,
			[/^item$/i, /waste value/i, /^qty$/i],
		);
	});

	test('TC_RCSP-324_12 - selected period uses the updated calculation and excludes Price Differential', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.applyDateRange(dateDaysAgo(30), dateDaysAgo(0));
		await verifyActualFoodCostFormula(foodCostPage);
	});

	test('TC_RCSP-324_13 - date range Apply refreshes the dashboard without restoring Price Differential', { tag: ['@functional'] }, async ({ page }) => {
		const foodCostPage = await openFoodCost(page);
		await foodCostPage.verifyDateRangeControls();
		await foodCostPage.applyDateRange(dateDaysAgo(7), dateDaysAgo(0));
		await foodCostPage.verifyBreakdownComponents();
		await foodCostPage.verifyPriceDifferentialAbsent();
	});
});
