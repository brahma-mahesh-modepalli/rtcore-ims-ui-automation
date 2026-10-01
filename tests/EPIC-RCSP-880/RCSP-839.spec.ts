import { readFile } from 'node:fs/promises';
import { test, expect, type Page, type Browser } from '@playwright/test';
import {
	getStockCountRoleAccount,
	getStockCountRoleDisplayName,
	type StockCountRole,
} from '../../config/stockCountRoleCredentials';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { StockCountPage } from '../../pages/Stock Count/StockCountPage';
import { DailyShiftCountPage } from '../../pages/Stock Count/DailyShiftCountPage';
import { StockCountAddItemPage } from '../../pages/Stock Count/StockCountAddItemPage';
import { StockCountCountedQuantityPage } from '../../pages/Stock Count/StockCountCountedQuantityPage';
import { StockCountVariancePage } from '../../pages/Stock Count/StockCountVariancePage';
import { WeeklyCountPage } from '../../pages/Stock Count/WeeklyCountPage';
import { MonthlyCountPage } from '../../pages/Stock Count/MonthlyCountPage';
import { StoreInventoryItemsPage } from '../../pages/Inventory/StoreInventoryItemsPage';
import { TestDataRepository, type WasteableIngredientData } from '../../test-data/TestDataRepository';

const STORE_ID = 37;
const STORE_NAME = 'WB Unit 1034';
const REGION = '1700 San Antonio 4126314';
const MARKET = '1708 E Central SA 4126393';
const repository = new TestDataRepository();
const blindRoles: StockCountRole[] = ['shiftLeader', 'restaurantManager', 'operatingPartner'];
let lockedDailyCountName = '';

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function uniqueCountName(testId: string): string {
	return `${testId}-${Date.now()}`;
}

async function loginAsRole(page: Page, role: StockCountRole): Promise<void> {
	const account = getStockCountRoleAccount(role);
	const loginPage = new RTCDashboardLoginPage(page);
	await loginPage.loginWithMicrosoftSso(account.username, account.displayName);
	const transfersPage = new TransfersPage(page);
	await transfersPage.switchStore(REGION, MARKET, STORE_NAME);
	await transfersPage.verifyActiveStore(STORE_NAME);
}

async function addDailyCountItem(page: Page, item: WasteableIngredientData): Promise<{
	stockCountPage: StockCountPage;
	dailyPage: DailyShiftCountPage;
	countedPage: StockCountCountedQuantityPage;
	countName: string;
}> {
	const stockCountPage = new StockCountPage(page);
	await stockCountPage.navigateToDailyShiftCount();
	const dailyPage = new DailyShiftCountPage(page);
	const countName = uniqueCountName('RCSP-839');
	await dailyPage.createDailyShiftCount({ shift: 'AM', shiftDate: today(), name: countName });
	await dailyPage.openAddItemDialog();
	await new StockCountAddItemPage(page).addActiveItem(item.sku, item.name);
	return {
		stockCountPage,
		dailyPage,
		countedPage: new StockCountCountedQuantityPage(page),
		countName,
	};
}

async function addWeeklyCountItem(page: Page, item: WasteableIngredientData, name: string): Promise<WeeklyCountPage> {
	const stockCountPage = new StockCountPage(page);
	await stockCountPage.navigateToWeeklyCount();
	const weeklyPage = new WeeklyCountPage(page);
	await weeklyPage.startWeeklyCount('AM', { shiftDate: today(), name });
	await weeklyPage.openAddItemDialog();
	await new StockCountAddItemPage(page).addActiveItem(item.sku, item.name);
	return weeklyPage;
}

async function addMonthlyCountItem(page: Page, item: WasteableIngredientData): Promise<MonthlyCountPage> {
	const stockCountPage = new StockCountPage(page);
	await stockCountPage.navigateToMonthlyCount();
	const monthlyPage = new MonthlyCountPage(page);
	await monthlyPage.startMonthlyCount('AM', { shiftDate: today() });
	await monthlyPage.openAddItemDialog();
	await new StockCountAddItemPage(page).addActiveItem(item.sku, item.name);
	return monthlyPage;
}

async function expectBlindCount(page: Page): Promise<void> {
	const table = page.getByRole('table').last();
	for (const heading of [/location/i, /^item$/i, /counted/i, /actions/i]) {
		await expect(table.getByRole('columnheader', { name: heading }).first()).toBeVisible();
	}
	for (const heading of [/^expected$/i, /variance/i, /^status$/i, /flagged/i]) {
		await expect(table.getByRole('columnheader', { name: heading })).toHaveCount(0);
	}
	await expect(page.getByText(/^flagged$/i, { exact: true })).toHaveCount(0);
}

async function expectVisibleCountDetails(page: Page): Promise<void> {
	const table = page.getByRole('table').last();
	for (const heading of [/expected/i, /variance/i, /^status$/i]) {
		await expect(table.getByRole('columnheader', { name: heading }).first()).toBeVisible();
	}
}

async function applyExportAndReadText(page: Page, weeklyPage: WeeklyCountPage): Promise<string> {
	await weeklyPage.openExportDialog();
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		weeklyPage.exportWeeklyCountAsCsv(),
	]);
	const path = await download.path();
	expect(path, 'CSV export did not produce a downloadable file').toBeTruthy();
	return readFile(path!, 'utf8');
}

test.describe('RCSP-839 - Stock Count role visibility and inventory behavior', () => {
	test.setTimeout(180_000);
	test.describe.configure({ mode: 'serial' });

	test('TC_RCSP-839_01 - zero-stock wasteable SKU can be added to a daily count', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getWasteableItemWithZeroStockByStoreId(STORE_ID);
		test.skip(!item, `No zero-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'marketLeader');
		const { dailyPage } = await addDailyCountItem(page, item!);
		await expect(page.getByRole('row').filter({ hasText: item!.name }).first()).toBeVisible();
		await expect(dailyPage.addItemButton.first()).toBeVisible();
	});

	test('TC_RCSP-839_02 - negative-stock wasteable SKU can be added to a daily count', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getWasteableItemWithNegativeStockByStoreId(STORE_ID);
		test.skip(!item, `No negative-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'marketLeader');
		await addDailyCountItem(page, item!);
		await expect(page.getByRole('row').filter({ hasText: item!.name }).first()).toBeVisible();
	});

	test('TC_RCSP-839_03 - positive stock can be counted and the inventory remains unchanged before submit', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'marketLeader');
		const before = await repository.getWasteableStockBySkuAndStore(item!.sku, STORE_ID);
		const { countedPage } = await addDailyCountItem(page, item!);
		await countedPage.enterEaQuantity(item!.name, '1');
		await countedPage.saveCounts();
		const after = await repository.getWasteableStockBySkuAndStore(item!.sku, STORE_ID);
		expect(Number(after?.qty_on_hand)).toBe(Number(before?.qty_on_hand));
	});

	for (const role of blindRoles) {
		test(`TC_RCSP-839_${role === 'shiftLeader' ? '04' : role === 'restaurantManager' ? '05' : '06'} - ${getStockCountRoleDisplayName(role)} blind count hides expected and variance`, { tag: ['@functional'] }, async ({ page }) => {
			const item = await repository.getPositiveWasteableIngredient(STORE_ID);
			test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
			await loginAsRole(page, role);
			await addDailyCountItem(page, item!);
			await expectBlindCount(page);
		});
	}

	test('TC_RCSP-839_07 - Market Leader sees Expected, Variance, and Status during entry', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'marketLeader');
		await addDailyCountItem(page, item!);
		await expectVisibleCountDetails(page);
	});

	test('TC_RCSP-839_08 - blind count stays unflagged during entry', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'shiftLeader');
		const { countedPage } = await addDailyCountItem(page, item!);
		await countedPage.enterEaQuantity(item!.name, '999');
		await countedPage.saveCounts();
		await expectBlindCount(page);
	});

	test('TC_RCSP-839_09 - Expected, Variance, and Status appear after a blind count is locked', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'shiftLeader');
		const { countedPage, countName } = await addDailyCountItem(page, item!);
		await countedPage.enterEaQuantity(item!.name, '1');
		await countedPage.saveCounts();
		await new StockCountVariancePage(page).lockCount();
		lockedDailyCountName = countName;
		await expectVisibleCountDetails(page);
	});

	test('TC_RCSP-839_10 - submitted count details are visible to all four roles', { tag: ['@functional'] }, async ({ browser }) => {
		test.skip(!lockedDailyCountName, 'TC_RCSP-839_09 did not create a locked Daily Shift Count.');
		for (const role of [...blindRoles, 'marketLeader' as const]) {
			const context = await browser.newContext();
			try {
				const page = await context.newPage();
				await loginAsRole(page, role);
				await new StockCountPage(page).navigateToDailyShiftCount();
				const dailyPage = new DailyShiftCountPage(page);
				await dailyPage.openDailyShiftCount(lockedDailyCountName);
				await expectVisibleCountDetails(page);
			} finally {
				await context.close();
			}
		}
	});

	test('TC_RCSP-839_11 - in-progress blind Weekly Count export excludes hidden fields', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'shiftLeader');
		const weeklyPage = await addWeeklyCountItem(page, item!, uniqueCountName('RCSP-839-11'));
		const csv = await applyExportAndReadText(page, weeklyPage);
		expect(csv).not.toMatch(/expected|variance|flagged/i);
	});

	test('TC_RCSP-839_12 - submitted Weekly Count export includes result fields', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'shiftLeader');
		const weeklyPage = await addWeeklyCountItem(page, item!, uniqueCountName('RCSP-839-12'));
		await weeklyPage.updateItemCount(item!.name, 'ea', '1');
		await weeklyPage.saveCounts();
		await new StockCountVariancePage(page).lockCount();
		const csv = await applyExportAndReadText(page, weeklyPage);
		expect(csv).toMatch(/expected/i);
		expect(csv).toMatch(/variance/i);
		expect(csv).toMatch(/status/i);
	});

	test('TC_RCSP-839_13 - Inventory Balances remains unchanged during saved count entry', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'marketLeader');
		const transfersPage = new TransfersPage(page);
		await transfersPage.openInventoryBalances();
		await transfersPage.searchInventoryItem(item!.sku);
		const before = await transfersPage.getOnHandValue(item!.sku);
		const { countedPage } = await addDailyCountItem(page, item!);
		await countedPage.enterEaQuantity(item!.name, '1');
		await countedPage.saveCounts();
		await transfersPage.openInventoryBalances();
		await transfersPage.searchInventoryItem(item!.sku);
		expect(await transfersPage.getOnHandValue(item!.sku)).toBe(before);
	});

	test('TC_RCSP-839_14 - Store Inventory Items remains unchanged during saved count entry', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'marketLeader');
		const storeInventoryPage = new StoreInventoryItemsPage(page);
		await storeInventoryPage.openStoreInventoryItems();
		await storeInventoryPage.searchByNameOrSku(item!.sku);
		const row = storeInventoryPage.itemRow(item!.sku);
		const headers = storeInventoryPage.itemsTable.getByRole('columnheader');
		const headerTexts = await headers.allInnerTexts();
		const onHandIndex = headerTexts.findIndex((header) => /on hand/i.test(header));
		test.skip(onHandIndex < 0, 'Store Inventory Items does not expose an On Hand column in this environment.');
		const beforeText = await row.getByRole('cell').nth(onHandIndex).innerText();
		const before = Number(beforeText.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0]);
		const { countedPage } = await addDailyCountItem(page, item!);
		await countedPage.enterEaQuantity(item!.name, '1');
		await countedPage.saveCounts();
		await storeInventoryPage.openStoreInventoryItems();
		await storeInventoryPage.searchByNameOrSku(item!.sku);
		const afterText = await storeInventoryPage.itemRow(item!.sku).getByRole('cell').nth(onHandIndex).innerText();
		const after = Number(afterText.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0]);
		expect(after).toBe(before);
	});

	test('TC_RCSP-839_15 - Weekly Count entry is blind for restricted roles', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'shiftLeader');
		const weeklyPage = await addWeeklyCountItem(page, item!, uniqueCountName('RCSP-839-15'));
		await expectBlindCount(page);
		await expect(weeklyPage.flaggedItemsCardLabel).toHaveCount(0);
	});

	test('TC_RCSP-839_16 - Monthly Count entry is blind for restricted roles', { tag: ['@functional'] }, async ({ page }) => {
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		test.skip(!item, `No positive-stock wasteable SKU exists at store ${STORE_ID}`);
		await loginAsRole(page, 'operatingPartner');
		const monthlyPage = await addMonthlyCountItem(page, item!);
		await expectBlindCount(page);
		await expect(monthlyPage.flaggedItemsCardLabel).toHaveCount(0);
	});

	test('TC_RCSP-839_17 - other supported count types honor blind-count visibility', { tag: ['@functional'] }, async ({ page }) => {
		await loginAsRole(page, 'shiftLeader');
		const menu = new StockCountPage(page);
		await menu.navigateToDailyShiftCount();
		for (const countType of ['Period Count', 'Spot Count', 'Ad Hoc Count']) {
			await expect(page.getByRole('link', { name: new RegExp(`^${countType}$`, 'i') })).toHaveCount(0);
		}
		test.skip(true, 'The current Stock Count navigation exposes Daily, Weekly, and Monthly only; Period, Spot, and Ad Hoc counts are unavailable in this build.');
	});

	test('TC_RCSP-839_18 - blind-count configuration can be changed without a release', { tag: ['@regression'] }, async () => {
		test.skip(true, 'No blind-count configuration control is exposed in the current application UI or project configuration.');
	});

	test('TC_RCSP-839_19 - blind-count behavior is retained during offline synchronization', { tag: ['@regression'] }, async () => {
		test.skip(true, 'Offline stock-count creation and synchronization are not supported by the available application/test interfaces.');
	});

	test('TC_RCSP-839_20 - Counted control is positioned next to Item', { tag: ['@functional'] }, async ({ page }) => {
		const items = await repository.getEligibleWasteableIngredients(STORE_ID);
		test.skip(items.length < 2, 'At least two eligible inventory items are required for layout validation.');
		await loginAsRole(page, 'marketLeader');
		const stockCountPage = new StockCountPage(page);
		await stockCountPage.navigateToDailyShiftCount();
		const dailyPage = new DailyShiftCountPage(page);
		await dailyPage.createDailyShiftCount({ shift: 'AM', shiftDate: today(), name: uniqueCountName('RCSP-839-20') });
		const addItemPage = new StockCountAddItemPage(page);
		for (const item of items.slice(0, 2)) {
			await dailyPage.openAddItemDialog();
			await addItemPage.addActiveItem(item.sku, item.name);
		}
		const itemHeader = page.getByRole('columnheader', { name: /^item$/i }).first();
		const countedHeader = page.getByRole('columnheader', { name: /counted/i }).first();
		const itemBox = await itemHeader.boundingBox();
		const countedBox = await countedHeader.boundingBox();
		expect(itemBox).not.toBeNull();
		expect(countedBox).not.toBeNull();
		expect(countedBox!.x).toBeGreaterThan(itemBox!.x);
		expect(countedBox!.x - itemBox!.x).toBeLessThan(500);
	});
});
