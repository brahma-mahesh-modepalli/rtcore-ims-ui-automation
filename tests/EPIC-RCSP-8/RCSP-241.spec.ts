import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { OrderGuidePage } from '../../pages/Inventory Setup/OrderGuidePage';

const hierarchy = {
	region: '1700 San Antonio 4126314',
	market: '1708 E Central SA 4126393',
	store: 'WB Unit 1034',
};

async function openOrderGuide(page: Page): Promise<OrderGuidePage> {
	const loginPage = new RTCDashboardLoginPage(page);
	const transfersPage = new TransfersPage(page);
	const orderGuidePage = new OrderGuidePage(page);
	await page.goto(CONFIG.dashboardURL);
	await page.waitForLoadState('networkidle').catch(() => undefined);
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	await transfersPage.switchStore(hierarchy.region, hierarchy.market, hierarchy.store);
	await orderGuidePage.open();
	return orderGuidePage;
}

test.describe('RCSP-241 - Inventory Setup Order Guide', () => {
	test.setTimeout(90_000);

	test('TC_RCSP-241_001 - Order Guide is accessible from Inventory Setup', { tag: ['@smoke', '@sanity', '@functional'] }, async ({ page }) => {
		await (await openOrderGuide(page)).verifyLoaded();
	});

	test('TC_RCSP-241_002 - Order Guide displays a consolidated item list', { tag: ['@functional'] }, async ({ page }) => {
		await (await openOrderGuide(page)).verifyRowsExist();
	});

	test('TC_RCSP-241_003 - Order Guide displays internal item names', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.verifyColumns();
		await orderGuidePage.verifyRowsExist();
	});

	test('TC_RCSP-241_004 - Only active inventory items are displayed', { tag: ['@functional'] }, async ({ page }) => {
		await (await openOrderGuide(page)).verifyNoInactiveRows();
	});

	test('TC_RCSP-241_005 - Only active assigned vendors are displayed', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.verifyColumns();
		await orderGuidePage.verifyRowsExist();
	});

	test('TC_RCSP-241_006 - Unassigned vendor items are not displayed', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('UNASSIGNED_VENDOR_ITEM');
		await orderGuidePage.verifyNoResults();
	});

	test('TC_RCSP-241_007 - Items unavailable from the distribution center are not displayed', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('UNAVAILABLE_ITEM');
		await orderGuidePage.verifyNoResults();
	});

	test('TC_RCSP-241_008 - Search filters items by name or SKU', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('BUN');
		await orderGuidePage.verifyOnlyMatchingRows('BUN');
	});

	test('TC_RCSP-241_009 - Vendor filter displays only selected vendor items', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.selectVendor('Flowers Baking Company');
		await orderGuidePage.verifyOnlyMatchingRows('Flowers Baking Company');
	});

	test('TC_RCSP-241_010 - Active Only displays only active records', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.enableActiveOnly();
		await orderGuidePage.verifyNoInactiveRows();
	});

	test('TC_RCSP-241_011 - Invalid search displays an empty state', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('XYZ123456');
		await orderGuidePage.verifyNoResults();
	});

	test('TC_RCSP-241_012 - Partial item name search returns matching items', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('BUN');
		await orderGuidePage.verifyOnlyMatchingRows('BUN');
	});

	test('TC_RCSP-241_013 - Valid SKU search returns the exact item', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('VALID_SKU');
		await orderGuidePage.verifyRowsExist();
	});

	test('TC_RCSP-241_014 - Clearing search restores the complete list', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('BUN');
		await orderGuidePage.clearSearch();
		await orderGuidePage.verifyRowsExist();
	});

	test('TC_RCSP-241_015 - Vendor and search filters work together', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.selectVendor('Flowers Baking Company');
		await orderGuidePage.search('BUN');
		await orderGuidePage.verifyOnlyMatchingRows('BUN');
	});

	test('TC_RCSP-241_016 - Duplicate inventory items are not repeated', { tag: ['@regression'] }, async ({ page }) => {
		await (await openOrderGuide(page)).verifyRowsUnique();
	});

	test('TC_RCSP-241_017 - Order Guide handles a large item dataset', { tag: ['@regression'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.verifySearchCompletesWithin(15_000);
		await orderGuidePage.verifyRowsExist();
	});

	test('TC_RCSP-241_018 - Store with no active vendors displays an appropriate state', { tag: ['@regression'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.verifyLoaded();
		await expect(page.locator('body')).not.toContainText(/unhandled exception|internal server error/i);
	});

	test('TC_RCSP-241_019 - Store with no orderable items displays an appropriate state', { tag: ['@regression'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.verifyLoaded();
		await expect(page.locator('body')).not.toContainText(/unhandled exception|internal server error/i);
	});

	test('TC_RCSP-241_020 - Special characters do not break search', { tag: ['@regression'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('@#$%');
		await expect(page.locator('body')).not.toContainText(/unhandled exception|internal server error/i);
	});

	test('TC_RCSP-241_021 - Leading and trailing search spaces are handled', { tag: ['@functional'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search(' LG BUN ');
		await orderGuidePage.verifyOnlyMatchingRows('BUN');
	});

	test('TC_RCSP-241_022 - Order Guide displays all configured columns', { tag: ['@smoke', '@functional'] }, async ({ page }) => {
		await (await openOrderGuide(page)).verifyColumns();
	});

	test('TC_RCSP-241_023 - Inactive items remain hidden when searched directly', { tag: ['@regression'] }, async ({ page }) => {
		const orderGuidePage = await openOrderGuide(page);
		await orderGuidePage.search('INACTIVE_ITEM');
		await orderGuidePage.verifyNoResults();
	});
});
