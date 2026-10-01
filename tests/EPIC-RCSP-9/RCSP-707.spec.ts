import { ACTIVE_STORE_CONTEXT, test, expect } from '../../fixtures/baseTest';
import type { Page } from '@playwright/test';
import { LogWastePage } from '../../pages/Wastage/LogWastePage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
	TestDataRepository,
} from '../../test-data/TestDataRepository';

const STORE_ID = ACTIVE_STORE_CONTEXT.storeId;
const STORE_NAME = ACTIVE_STORE_CONTEXT.storeName;
const repository = new TestDataRepository();

let depletedSku: string | undefined;

async function openItemPicker(page: Page, wastePage: LogWastePage): Promise<void> {
	await wastePage.openLogWaste();
	await wastePage.openLogWasteModal();
	await wastePage.selectShift('AM');
	await wastePage.createWasteLogButton.click();
	await wastePage.verifyWasteLogDetailLoaded();
	await wastePage.setType('ITEM');
}

async function checkPickerVisibility(
	page: Page,
	wastePage: LogWastePage,
	sku: string,
	visible: boolean,
): Promise<void> {
	const nativePicker = page
		.locator('main select:not([aria-hidden="true"])')
		.filter({ hasText: /search wasteable item|search item/i })
		.first();
	if (!visible && await nativePicker.isVisible().catch(() => false)) {
		await wastePage.verifyItemPickerResultAbsent(sku);
		return;
	}
	await wastePage.searchItemPicker(sku);
	if (visible) {
		await wastePage.verifyItemPickerResultVisible(sku);
	} else {
		await wastePage.verifyItemPickerResultAbsent(sku);
	}
}

test.describe('RCSP-707 - waste item picker stock eligibility', () => {
	test.setTimeout(120_000);

	test('TC_RCSP-707_01 - positive-stock wasteable item is displayed and selectable', { tag: ['@smoke', '@sanity', '@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBe(STORE_NAME);
		const item = await repository.getPositiveWasteableIngredient(STORE_ID);
		const sku_id_variable = item ? String(item.sku) : '';
		console.log('TC_RCSP-707_01 SKU ID:', sku_id_variable || '<no SKU returned>');
		test.skip(!item, `No wasteable item with positive stock found in store ${STORE_ID}`);
		const wastePage = new LogWastePage(page);
		await openItemPicker(page, wastePage);
		await wastePage.selectItemBySku(sku_id_variable);
	});

	test('TC_RCSP-707_02 - zero-stock wasteable item is excluded', { tag: ['@regression'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBe(STORE_NAME);
		const item = await repository.getWasteableItemWithZeroStockByStoreId(STORE_ID);
		const sku_id_variable = item ? String(item.sku) : '';
		console.log('TC_RCSP-707_02 SKU ID:', sku_id_variable || '<no SKU returned>');
		test.skip(!item, `No wasteable item with zero stock found in store ${STORE_ID}`);
		const wastePage = new LogWastePage(page);
		await openItemPicker(page, wastePage);
		await checkPickerVisibility(page, wastePage, sku_id_variable, false);
	});

	test('TC_RCSP-707_03 - negative-stock wasteable item is excluded', { tag: ['@regression'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBe(STORE_NAME);
		const item = await repository.getWasteableItemWithNegativeStockByStoreId(STORE_ID);
		const sku_id_variable = item ? String(item.sku) : '';
		console.log('TC_RCSP-707_03 SKU ID:', sku_id_variable || '<no SKU returned>');
		test.skip(!item, `No wasteable item with negative stock found in store ${STORE_ID}`);
		const wastePage = new LogWastePage(page);
		await openItemPicker(page, wastePage);
		await checkPickerVisibility(page, wastePage, sku_id_variable, false);
	});

	test.describe.serial('TC_RCSP-707_04/05 - item stock transition', () => {
		test('TC_RCSP-707_04 - item disappears after waste reduces its stock to zero', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
			expect(activeStoreContext.storeName).toBe(STORE_NAME);
			const item = await repository.getWasteableItemWithOneStockByStoreId(STORE_ID);
			const sku_id_variable = item ? String(item.sku) : '';
			console.log('TC_RCSP-707_04 SKU ID:', sku_id_variable || '<no SKU returned>');
			test.skip(!item, `No wasteable item with exactly one unit in store ${STORE_ID}`);
			depletedSku = sku_id_variable;
			const reason = await repository.getFirstActiveWasteReason();
			const uom = await repository.getUomByAbbreviation('EA');
			expect(reason, 'No active waste reason returned by the database').toBeDefined();
			expect(uom, 'EA unit of measure was not found').toBeDefined();

			const wastePage = new LogWastePage(page);
			await openItemPicker(page, wastePage);
			await wastePage.selectItemBySku(sku_id_variable);
			await wastePage.selectReason(reason!.description);
			await wastePage.selectUom(uom!.abbreviation);
			await wastePage.fillQuantity(String(item!.qty_on_hand));
			await wastePage.fillNotes(`RCSP-707 deplete ${sku_id_variable} ${Date.now()}`);
			await wastePage.saveWasteLog();
			await wastePage.lockWasteLog();
			await wastePage.applyToStock();

			await expect.poll(async () => {
				const stock = await repository.getWasteableStockBySkuAndStore(sku_id_variable, STORE_ID);
				return Number(stock?.qty_on_hand ?? 0);
			}, { timeout: 60_000, intervals: [2000, 5000] }).toBe(0);

			await openItemPicker(page, wastePage);
			await checkPickerVisibility(page, wastePage, sku_id_variable, false);
		});

		test('TC_RCSP-707_05 - item reappears after stock is received at the selected store', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
			expect(activeStoreContext.storeName).toBe(STORE_NAME);
			test.skip(!depletedSku, 'TC_RCSP-707_04 did not leave a shared depleted SKU for the restock scenario.');
			const sku_id_variable: string = String(depletedSku);
			console.log('TC_RCSP-707_05 SKU ID:', sku_id_variable);
			const targetStock = await repository.getWasteableStockBySkuAndStore(sku_id_variable, STORE_ID);
			test.skip(Number(targetStock?.qty_on_hand ?? 0) !== 0, 'The item is not at zero stock before restocking.');
			expect(targetStock, `No stock row found for SKU ${sku_id_variable}`).toBeDefined();
			const source = await repository.getTransferableStockForSkuOutsideStore(sku_id_variable, STORE_ID);
			test.skip(!source, `No other store has transferable stock for SKU ${sku_id_variable}`);
			const sourceStore = await repository.getStoreById(source!.store_id);
			const targetStore = await repository.getStoreById(STORE_ID);
			const reason = await repository.getTransferReasonByCode('Demand');
			expect(sourceStore, `Source store ${source!.store_id} was not found`).toBeDefined();
			expect(targetStore, `Target store ${STORE_ID} was not found`).toBeDefined();
			expect(reason, 'Active Demand transfer reason was not found').toBeDefined();

			const transfersPage = new TransfersPage(page);
			await transfersPage.switchStoreViaHeader(sourceStore!.name);
			await transfersPage.verifyActiveStore(sourceStore!.name);
			await transfersPage.openTransfers();
			await transfersPage.clickNewTransfer();
			await transfersPage.verifyNewTransferFormVisible();
			await transfersPage.selectToStore(targetStore!.name);
			await transfersPage.selectTransferReason(reason!.description);
			await transfersPage.addItem(targetStock!.name, '1', sku_id_variable);
			await transfersPage.submitTransfer();
			await transfersPage.openTransfers();
			await transfersPage.selectStatusTab('Pending');
			const transferId = await transfersPage.getLatestTransferId('Pending');

			await transfersPage.switchStoreViaHeader(targetStore!.name);
			await transfersPage.verifyActiveStore(targetStore!.name);
			await transfersPage.openTransfers();
			await transfersPage.selectStatusTab('Pending');
			await transfersPage.clickAcceptForTransfer(transferId);
			await transfersPage.verifyApproveModalVisible();
			await transfersPage.confirmApprove();

			await expect.poll(async () => {
				const stock = await repository.getWasteableStockBySkuAndStore(sku_id_variable, STORE_ID);
				return Number(stock?.qty_on_hand ?? 0);
			}, { timeout: 60_000, intervals: [2000, 5000] }).toBeGreaterThan(0);

			await transfersPage.switchStoreViaHeader(targetStore!.name);
			const wastePage = new LogWastePage(page);
			await openItemPicker(page, wastePage);
			await checkPickerVisibility(page, wastePage, sku_id_variable, true);
		});
	});

	test('TC_RCSP-707_06 - exact SKU search excludes a zero-stock item', { tag: ['@regression'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBe(STORE_NAME);
		const item = await repository.getWasteableItemWithZeroStockByStoreId(STORE_ID);
		const sku_id_variable = item ? String(item.sku) : '';
		console.log('TC_RCSP-707_06 SKU ID:', sku_id_variable || '<no SKU returned>');
		test.skip(!item, `No wasteable item with zero stock found in store ${STORE_ID}`);
		const wastePage = new LogWastePage(page);
		await openItemPicker(page, wastePage);
		await wastePage.searchItemPicker(sku_id_variable);
		await wastePage.verifyItemPickerResultAbsent(sku_id_variable);
	});

	test('TC_RCSP-707_07 - picker excludes zero, negative, and non-wasteable stock items', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBe(STORE_NAME);
		const [positive, zero, negative, nonWasteable] = await Promise.all([
			repository.getPositiveWasteableIngredient(STORE_ID),
			repository.getWasteableItemWithZeroStockByStoreId(STORE_ID),
			repository.getWasteableItemWithNegativeStockByStoreId(STORE_ID),
			repository.getNonWasteableItemWithPositiveStockByStoreId(STORE_ID),
		]);
		console.log('TC_RCSP-707_07 positive-stock SKU ID:', positive?.sku ?? '<no SKU returned>');
		console.log('TC_RCSP-707_07 zero-stock SKU ID:', zero?.sku ?? '<no SKU returned>');
		console.log('TC_RCSP-707_07 negative-stock SKU ID:', negative?.sku ?? '<no SKU returned>');
		console.log('TC_RCSP-707_07 non-wasteable SKU ID:', nonWasteable?.sku ?? '<no SKU returned>');
		test.skip(!positive || !zero || !negative || !nonWasteable, 'Store must have positive, zero, negative, and non-wasteable stock rows for combined eligibility coverage.');
		const positive_sku_id_variable: string = String(positive!.sku);
		const zero_sku_id_variable: string = String(zero!.sku);
		const negative_sku_id_variable: string = String(negative!.sku);
		const non_wasteable_sku_id_variable: string = String(nonWasteable!.sku);
		const wastePage = new LogWastePage(page);
		await openItemPicker(page, wastePage);
		await checkPickerVisibility(page, wastePage, positive_sku_id_variable, true);
		await checkPickerVisibility(page, wastePage, zero_sku_id_variable, false);
		await checkPickerVisibility(page, wastePage, negative_sku_id_variable, false);
		await checkPickerVisibility(page, wastePage, non_wasteable_sku_id_variable, false);
	});

	test('TC_RCSP-707_08 - picker availability uses stock from the selected store', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBe(STORE_NAME);
		const item = await repository.getWasteableItemPositiveElsewhereAndZeroHere(STORE_ID);
		const sku_id_variable = item ? String(item.sku) : '';
		console.log('TC_RCSP-707_08 SKU ID:', sku_id_variable || '<no SKU returned>');
		test.skip(!item, `No SKU has positive stock elsewhere and zero stock in ${STORE_NAME}`);
		const otherStoreStock = await repository.getWasteableStockBySkuAndStore(sku_id_variable, item!.source_store_id);
		expect(Number(otherStoreStock?.qty_on_hand ?? 0)).toBeGreaterThan(0);
		expect(Number(item!.qty_on_hand)).toBeLessThanOrEqual(0);
		const wastePage = new LogWastePage(page);
		await openItemPicker(page, wastePage);
		await checkPickerVisibility(page, wastePage, sku_id_variable, false);
	});
});
