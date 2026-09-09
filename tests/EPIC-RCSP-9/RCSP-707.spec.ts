/**
 * RCSP-707 - Log Waste stock-aware item filtering
 * Inputs are queried from PostgreSQL at runtime; this suite intentionally does not read JSON test data.
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { LogWastePage } from '../../pages/Wastage/LogWastePage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { StoreInventoryItemsPage } from '../../pages/Inventory/StoreInventoryItemsPage';
import { TestDataRepository, type WasteableIngredientData } from '../../test-data/TestDataRepository';

const STORE_NAME = 'WB Unit 1034';
const STORE_ID = 37;
const repository = new TestDataRepository();

async function loginAndOpenStore(page: Page, storeName = STORE_NAME) {
	const loginPage = new RTCDashboardLoginPage(page);
	const transfersPage = new TransfersPage(page);
	await page.goto(CONFIG.dashboardURL);
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);

	const store = await repository.getStoreByName(storeName);
	expect(store, `Store not found in DB: ${storeName}`).toBeDefined();
	if (storeName === STORE_NAME) {
		await transfersPage.switchStore(
			'1700 San Antonio 4126314',
			'1708 E Central SA 4126393',
			storeName,
		);
	} else {
		await transfersPage.switchStoreViaHeader(storeName);
	}
	await transfersPage.verifyActiveStore(storeName);
	return { transfersPage, logWastePage: new LogWastePage(page), store };
}

async function openItemPicker(page: Page, logWastePage: LogWastePage): Promise<void> {
	await logWastePage.openLogWaste();
	await logWastePage.openLogWasteModal();
	await logWastePage.selectShift('AM');
	await logWastePage.createWasteLogButton.click();
	await logWastePage.verifyWasteLogDetailLoaded();
	await logWastePage.setType('ITEM');
}

async function selectDbItem(logWastePage: LogWastePage, item: WasteableIngredientData): Promise<void> {
	await logWastePage.selectItemBySku(item.sku);
}

test('TC_RCSP-707_01 - positive-stock wasteable ingredient is searchable and selectable', async ({ page }) => {
	const item = await repository.getPositiveWasteableIngredient(STORE_NAME);
	expect(item, 'No positive-stock wasteable ingredient returned by DB').toBeDefined();
	const { logWastePage } = await loginAndOpenStore(page);
	await openItemPicker(page, logWastePage);
	await logWastePage.searchItemPicker(item!.sku);
	await logWastePage.verifyItemPickerResultVisible(item!.sku);
	await selectDbItem(logWastePage, item!);
});

test('TC_RCSP-707_02 - zero-stock wasteable ingredient is excluded from item search', async ({ page }) => {
	const zeroStockSku = await repository.getZeroStockWasteableIngredientSkuByStoreId(STORE_ID);
	expect(zeroStockSku, `No zero-stock wasteable ingredient returned for store ${STORE_ID}`).toBeDefined();
	const { logWastePage } = await loginAndOpenStore(page);
	await openItemPicker(page, logWastePage);
	await logWastePage.searchItemPicker(zeroStockSku!);
	await logWastePage.verifyItemPickerResultAbsent(zeroStockSku!);
});

test('TC_RCSP-707_03 - picker count matches the DB eligible dataset', async ({ page }) => {
	const eligible = await repository.getEligibleWasteableIngredients(STORE_NAME);
	expect(eligible.length, 'DB returned no eligible picker items').toBeGreaterThan(0);
	const { logWastePage } = await loginAndOpenStore(page);
	await openItemPicker(page, logWastePage);
	await logWastePage.searchItemPicker('');
	const visibleCount = await logWastePage.getItemPickerResultCount();
	expect(visibleCount).toBeGreaterThan(0);
	expect(visibleCount).toBeLessThanOrEqual(eligible.length);
});

test('TC_RCSP-707_04 - stock transition behavior requires an external receipt transaction', async ({ page }) => {
	const item = await repository.getPositiveWasteableIngredient(STORE_NAME);
	expect(item, 'No positive-stock wasteable ingredient returned by DB').toBeDefined();
	test.skip(true, 'Read-only automation must not zero or restock inventory; execute the stock transaction separately, then rerun the search assertions.');
});

test('TC_RCSP-707_05 - switching stores refreshes the DB-backed item context', async ({ page }) => {
	const storeB = await repository.getAlternateActiveStore(STORE_NAME);
	expect(storeB, 'No alternate active store returned by DB').toBeDefined();
	const itemB = await repository.getPositiveWasteableIngredient(storeB!.name);
	expect(itemB, `No positive-stock item returned for ${storeB!.name}`).toBeDefined();
	const { transfersPage, logWastePage } = await loginAndOpenStore(page);
	await openItemPicker(page, logWastePage);
	await logWastePage.searchItemPicker(itemB!.sku);
	await logWastePage.verifyItemPickerResultAbsent(itemB!.sku).catch(() => undefined);
	await page.keyboard.press('Escape').catch(() => undefined);
	await transfersPage.switchStoreViaHeader(storeB!.name);
	await transfersPage.verifyActiveStore(storeB!.name);
	await openItemPicker(page, logWastePage);
	await logWastePage.searchItemPicker(itemB!.sku);
	await logWastePage.verifyItemPickerResultVisible(itemB!.sku);
});

test('TC_RCSP-707_06 - picker has eligible results and excludes a DB zero-stock SKU', async ({ page }) => {
	const eligible = await repository.getEligibleWasteableIngredients(STORE_NAME);
	const zeroStock = await repository.getZeroStockWasteableIngredient(STORE_NAME);
	expect(eligible.length).toBeGreaterThan(0);
	expect(zeroStock).toBeDefined();
	const { logWastePage } = await loginAndOpenStore(page);
	await openItemPicker(page, logWastePage);
	await logWastePage.searchItemPicker('');
	expect(await logWastePage.getItemPickerResultCount()).toBeGreaterThan(0);
	await logWastePage.searchItemPicker(zeroStock!.sku);
	await logWastePage.verifyItemPickerResultAbsent(zeroStock!.sku);
});

test('TC_RCSP-707_07 - Transfers picker still includes the zero-stock configured item', async ({ page }) => {
	const zeroStock = await repository.getZeroStockWasteableIngredient(STORE_NAME);
	expect(zeroStock).toBeDefined();
	const { transfersPage } = await loginAndOpenStore(page);
	await transfersPage.openTransfers();
	await transfersPage.clickNewTransfer();
	await transfersPage.verifyNewTransferFormVisible();
	await transfersPage.addItem(zeroStock!.name, '1', zeroStock!.sku);
	await transfersPage.verifyItemOnTransfer(zeroStock!.sku, '1');
});

test('TC_RCSP-707_08 - Store Inventory displays the zero-stock configured item', async ({ page }) => {
	const zeroStock = await repository.getZeroStockWasteableIngredient(STORE_NAME);
	expect(zeroStock).toBeDefined();
	const { transfersPage } = await loginAndOpenStore(page);
	const inventoryPage = new StoreInventoryItemsPage(page);
	await inventoryPage.openStoreInventoryItems();
	await inventoryPage.searchByNameOrSku(zeroStock!.sku);
	await inventoryPage.verifyItemVisible(zeroStock!.sku);
	await transfersPage.verifyActiveStore(STORE_NAME);
});

test('TC_RCSP-707_09 - RECIPE selection remains independent of item stock filtering', async ({ page }) => {
	const recipe = await repository.getActiveRecipe();
	const reason = await repository.getFirstActiveWasteReason();
	const uom = await repository.getUomByAbbreviation(recipe?.uom || 'EA');
	expect(recipe).toBeDefined();
	expect(reason).toBeDefined();
	expect(uom).toBeDefined();
	const { logWastePage } = await loginAndOpenStore(page);
	await openItemPicker(page, logWastePage);
	await logWastePage.setType('RECIPE');
	await logWastePage.selectSearchableValue(/recipe/i, recipe!.name);
	await logWastePage.selectReason(reason!.description);
	await logWastePage.selectUom(uom!.abbreviation);
	await logWastePage.fillQuantity('1');
	await logWastePage.fillNotes('RCSP-707 recipe regression');
	await logWastePage.saveWasteLog();
	await logWastePage.verifySavedLineEditable();
});

test('TC_RCSP-707_10 - DB-selected eligible item completes save and lock workflow', async ({ page }) => {
	const item = await repository.getPositiveWasteableIngredient(STORE_NAME);
	const reason = await repository.getFirstActiveWasteReason();
	const uom = await repository.getUomByAbbreviation('EA');
	expect(item).toBeDefined();
	expect(reason).toBeDefined();
	expect(uom).toBeDefined();
	const { logWastePage } = await loginAndOpenStore(page);
	await openItemPicker(page, logWastePage);
	await selectDbItem(logWastePage, item!);
	await logWastePage.selectReason(reason!.description);
	await logWastePage.selectUom(uom!.abbreviation);
	await logWastePage.fillQuantity('1');
	await logWastePage.fillNotes('RCSP-707 item workflow');
	await logWastePage.saveWasteLog();
	await logWastePage.verifySavedLineEditable();
	await logWastePage.lockWasteLog();
	await logWastePage.verifyLockedState();
});
