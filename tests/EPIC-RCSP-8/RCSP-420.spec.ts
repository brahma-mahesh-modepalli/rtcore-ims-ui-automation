import { test, expect } from '../../fixtures/baseTest';
import type { Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { HotShotOrderPage } from '../../pages/Ordering/HotShotOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData } from '../../utils/testData';
import type { TestDataRepository } from '../../test-data/TestDataRepository';

const FILE_NAME = 'RCSP-420';
const SCENARIO_ID = 'RCSP-420';
const STORE_ID = 37;
const FLOWERS_VENDOR = 'Flowers Baking Company';
const MCLANE_DATABASE_VENDOR = 'McLane Foodservice Inc - SA Corp';

const TC = {
	scheduledFlowers: 'TC_RCSP-420_01',
	scheduledMcLane: 'TC_RCSP-420_02',
	scheduledVendorSwitch: 'TC_RCSP-420_03',
	hotShotFlowers: 'TC_RCSP-420_04',
	hotShotMcLane: 'TC_RCSP-420_05',
	hotShotVendorSwitch: 'TC_RCSP-420_06',
	scheduledNoVendor: 'TC_RCSP-420_07',
	hotShotNoVendor: 'TC_RCSP-420_08',
} as const;

type OrderForm = {
	getVendorOptions(): Promise<string[]>;
	selectVendor(vendor: string): Promise<void>;
};

function useCase(id: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, id);
}

function normalizeAndSort(items: string[]): string[] {
	return items.map((item) => item.replace(/\s+/g, ' ').trim()).sort((left, right) => left.localeCompare(right));
}

async function getExpectedItems(
	testData: TestDataRepository,
	databaseVendorName: string,
): Promise<string[]> {
	const rows = await testData.getActiveOrderGuideItemsByStoreAndVendorName(
		STORE_ID,
		databaseVendorName,
	);
	test.skip(rows.length === 0, `No active order-guide items found for ${databaseVendorName} at store ${STORE_ID}`);
	return rows.map((row) => row.item_name);
}

async function selectRuntimeVendor(form: OrderForm, databaseVendorName: string): Promise<string | undefined> {
	const options = await form.getVendorOptions();
	const exactMatch = options.find(
		(option) => option.replace(/\s+/g, ' ').trim().toLowerCase() === databaseVendorName.toLowerCase(),
	);
	const vendor = exactMatch ?? (
		databaseVendorName.startsWith('McLane')
			? options.find((option) => /McLane Foodservice Inc/i.test(option))
			: undefined
	);
	if (!vendor) {
		test.skip(true, `No UI vendor option corresponds to database vendor ${databaseVendorName}`);
		return undefined;
	}
	await form.selectVendor(vendor);
	return vendor;
}

async function assertItemListsMatch(expected: string[], actual: string[], description: string): Promise<void> {
	expect(
		normalizeAndSort(actual),
		`${description}: dropdown names should match all active database-mapped item names, including duplicates`,
	).toEqual(normalizeAndSort(expected));
}

async function loginAndSelectStore(page: Page): Promise<void> {
	const loginPage = new RTCDashboardLoginPage(page);
	await page.goto(CONFIG.dashboardURL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	await new TransfersPage(page).switchStore(
		'1700 San Antonio 4126314',
		'1708 E Central SA 4126393',
		'WB Unit 1034',
	);
}

async function openScheduledOrderForm(page: Page): Promise<ScheduledOrderPage> {
	await page.goto(new URL('/orders/scheduled', CONFIG.baseURL).toString(), {
		waitUntil: 'domcontentloaded',
		timeout: 30_000,
	});
	const orderPage = new ScheduledOrderPage(page);
	await orderPage.verifyScheduledOrdersPageLoaded();
	await orderPage.clickNewScheduledOrderButton();
	await orderPage.verifyNewScheduledOrderFormLoaded();
	return orderPage;
}

async function openHotShotOrderForm(page: Page): Promise<HotShotOrderPage> {
	await page.goto(new URL('/orders/hotshot', CONFIG.baseURL).toString(), {
		waitUntil: 'domcontentloaded',
		timeout: 30_000,
	});
	const orderPage = new HotShotOrderPage(page);
	await orderPage.verifyHotShotOrderPageLoaded();
	return orderPage;
}

async function compareScheduledItems(
	orderPage: ScheduledOrderPage,
	testData: TestDataRepository,
	databaseVendorName: string,
): Promise<string[]> {
	const expected = await getExpectedItems(testData, databaseVendorName);
	await selectRuntimeVendor(orderPage, databaseVendorName);
	const actual = await orderPage.getAllItemDropdownOptions();
	await assertItemListsMatch(expected, actual, `Scheduled Orders / ${databaseVendorName}`);
	return actual;
}

async function compareHotShotItems(
	orderPage: HotShotOrderPage,
	testData: TestDataRepository,
	databaseVendorName: string,
): Promise<string[]> {
	const expected = await getExpectedItems(testData, databaseVendorName);
	await selectRuntimeVendor(orderPage, databaseVendorName);
	const actual = await orderPage.getItemDropdownOptions();
	await assertItemListsMatch(expected, actual, `Hot Shot Orders / ${databaseVendorName}`);
	return actual;
}

test.describe('RCSP-420 - Vendor-mapped item dropdowns', () => {
	test.setTimeout(180_000);

	test.beforeEach(async ({ page }) => {
		await loginAndSelectStore(page);
	});

	test('TC_RCSP-420_01 - Scheduled Order shows database-mapped Flowers items', async ({ page, testData }) => {
		useCase(TC.scheduledFlowers);
		const orderPage = await openScheduledOrderForm(page);
		await compareScheduledItems(orderPage, testData, FLOWERS_VENDOR);
	});

	test('TC_RCSP-420_02 - Scheduled Order shows database-mapped McLane items', async ({ page, testData }) => {
		useCase(TC.scheduledMcLane);
		const orderPage = await openScheduledOrderForm(page);
		await compareScheduledItems(orderPage, testData, MCLANE_DATABASE_VENDOR);
	});

	test('TC_RCSP-420_03 - Scheduled Order refreshes items when switching vendors', async ({ page, testData }) => {
		useCase(TC.scheduledVendorSwitch);
		const flowersExpected = await getExpectedItems(testData, FLOWERS_VENDOR);
		const mclaneExpected = await getExpectedItems(testData, MCLANE_DATABASE_VENDOR);
		const orderPage = await openScheduledOrderForm(page);

		await selectRuntimeVendor(orderPage, FLOWERS_VENDOR);
		const flowersActual = await orderPage.getAllItemDropdownOptions();
		await assertItemListsMatch(flowersExpected, flowersActual, 'Scheduled Orders / Flowers before vendor switch');

		await selectRuntimeVendor(orderPage, MCLANE_DATABASE_VENDOR);
		const mclaneActual = await orderPage.getAllItemDropdownOptions();
		await assertItemListsMatch(mclaneExpected, mclaneActual, 'Scheduled Orders / McLane after vendor switch');

		const flowersExclusive = flowersExpected.filter((item) => !mclaneExpected.includes(item));
		const mclaneExclusive = mclaneExpected.filter((item) => !flowersExpected.includes(item));
		expect(mclaneActual.filter((item) => flowersExclusive.includes(item))).toEqual([]);
		expect(flowersActual.filter((item) => mclaneExclusive.includes(item))).toEqual([]);
	});

	test('TC_RCSP-420_04 - Hot Shot Order shows database-mapped Flowers items', async ({ page, testData }) => {
		useCase(TC.hotShotFlowers);
		const orderPage = await openHotShotOrderForm(page);
		await compareHotShotItems(orderPage, testData, FLOWERS_VENDOR);
	});

	test('TC_RCSP-420_05 - Hot Shot Order shows database-mapped McLane items', async ({ page, testData }) => {
		useCase(TC.hotShotMcLane);
		const orderPage = await openHotShotOrderForm(page);
		await compareHotShotItems(orderPage, testData, MCLANE_DATABASE_VENDOR);
	});

	test('TC_RCSP-420_06 - Hot Shot Order refreshes items when switching vendors', async ({ page, testData }) => {
		useCase(TC.hotShotVendorSwitch);
		const flowersExpected = await getExpectedItems(testData, FLOWERS_VENDOR);
		const mclaneExpected = await getExpectedItems(testData, MCLANE_DATABASE_VENDOR);
		const orderPage = await openHotShotOrderForm(page);

		await selectRuntimeVendor(orderPage, FLOWERS_VENDOR);
		const flowersActual = await orderPage.getItemDropdownOptions();
		await assertItemListsMatch(flowersExpected, flowersActual, 'Hot Shot / Flowers before vendor switch');

		await selectRuntimeVendor(orderPage, MCLANE_DATABASE_VENDOR);
		const mclaneActual = await orderPage.getItemDropdownOptions();
		await assertItemListsMatch(mclaneExpected, mclaneActual, 'Hot Shot / McLane after vendor switch');

		const flowersExclusive = flowersExpected.filter((item) => !mclaneExpected.includes(item));
		const mclaneExclusive = mclaneExpected.filter((item) => !flowersExpected.includes(item));
		expect(mclaneActual.filter((item) => flowersExclusive.includes(item))).toEqual([]);
		expect(flowersActual.filter((item) => mclaneExclusive.includes(item))).toEqual([]);
	});

	test('TC_RCSP-420_07 - Scheduled Order does not show items before vendor selection', async ({ page, testData }) => {
		useCase(TC.scheduledNoVendor);
		const expectedFlowers = await getExpectedItems(testData, FLOWERS_VENDOR);
		const orderPage = await openScheduledOrderForm(page);
		await expect(orderPage.lineItemVendorDisabledButton).toBeDisabled();
		expect(await orderPage.getAllItemDropdownOptions()).toEqual([]);

		await selectRuntimeVendor(orderPage, FLOWERS_VENDOR);
		await assertItemListsMatch(expectedFlowers, await orderPage.getAllItemDropdownOptions(), 'Scheduled Orders / Flowers after selection');
	});

	test('TC_RCSP-420_08 - Hot Shot Order does not show items before vendor selection', async ({ page, testData }) => {
		useCase(TC.hotShotNoVendor);
		const expectedFlowers = await getExpectedItems(testData, FLOWERS_VENDOR);
		const orderPage = await openHotShotOrderForm(page);
		await expect(orderPage.lineItemVendorDisabledButton).toBeDisabled();
		expect(await orderPage.getItemDropdownOptions()).toEqual([]);

		await selectRuntimeVendor(orderPage, FLOWERS_VENDOR);
		await assertItemListsMatch(expectedFlowers, await orderPage.getItemDropdownOptions(), 'Hot Shot / Flowers after selection');
	});
});
