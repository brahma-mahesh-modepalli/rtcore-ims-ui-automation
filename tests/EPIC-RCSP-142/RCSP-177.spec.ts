import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { VendorSetupPage } from '../../pages/Inventory Setup/VendorSetupPage';
import { getScenarioTestCaseData } from '../../utils/testData';

const FILE_NAME = 'RCSP-177';
const SCENARIO_ID = 'RCSP-177';
const STORE_ID = 37;
const VENDOR_ID = 3;
const VENDOR_CODE = '1515719';
const VENDOR_NAME = 'McLane Foodservice Inc - SA Corp';
const STORE_NAME = 'WB Unit 1034';

const TC = {
	compareCurrentWeek: 'TC_RCSP-177_01',
	excludeOutsideWeek: 'TC_RCSP-177_02',
} as const;

function useCase(id: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, id);
}

function parseDateParts(value: string, source: 'ui' | 'database' = 'ui'): [number, number, number] {
	const normalized = value.replace(/\s+/g, ' ').trim();
	const slashDate = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
	if (slashDate) {
		return source === 'database'
			? [Number(slashDate[3]), Number(slashDate[2]), Number(slashDate[1])]
			: [Number(slashDate[3]), Number(slashDate[1]), Number(slashDate[2])];
	}

	const iso = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (iso) {
		return [Number(iso[1]), Number(iso[2]), Number(iso[3])];
	}

	const parsed = new Date(normalized);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`Unable to parse delivery date from UI: ${value}`);
	}
	return [parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()];
}

function formatIsoDate(value: string, source: 'ui' | 'database'): string {
	const [year, month, day] = parseDateParts(value, source);
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateSortKey(value: string): number {
	const [year, month, day] = parseDateParts(value);
	return new Date(year, month - 1, day).getTime();
}


function normalizeAndSortDates(values: string[], source: 'ui' | 'database'): string[] {
	return values
		.map((value) => formatIsoDate(value, source))
		.sort((left, right) => left.localeCompare(right));
}

function currentWeekBounds(): { start: number; end: number } {
	const today = new Date();
	const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const daysSinceMonday = (start.getDay() + 6) % 7;
	start.setDate(start.getDate() - daysSinceMonday);
	const end = new Date(start);
	end.setDate(end.getDate() + 7);
	return { start: start.getTime(), end: end.getTime() };
}

async function loginAndSelectStore(page: import('@playwright/test').Page): Promise<void> {
	const loginPage = new RTCDashboardLoginPage(page);
	await page.goto(CONFIG.dashboardURL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	await new TransfersPage(page).switchStore(
		'1700 San Antonio 4126314',
		'1708 E Central SA 4126393',
		STORE_NAME,
	);
}

async function openDeliveryDates(
	page: import('@playwright/test').Page,
	vendorPage: VendorSetupPage,
): Promise<void> {
	await vendorPage.navigateToVendors();
	await vendorPage.openDeliveryDatesForVendor(VENDOR_CODE, VENDOR_NAME);
	await vendorPage.selectThisWeekDeliveryWindow();
	await vendorPage.searchDeliveryDatesByStore(STORE_NAME);
}

async function getExpectedThisWeekDates(
	testData: import('../../test-data/TestDataRepository').TestDataRepository,
): Promise<string[]> {
	return testData.getVendorDeliveryDatesForCurrentWeek(STORE_ID, VENDOR_ID);
}

test.describe('RCSP-177 - Vendor delivery dates for This Week', () => {
	test.setTimeout(180_000);

	test.beforeEach(async ({ page }) => {
		await loginAndSelectStore(page);
	});

	test('TC_RCSP-177_01 - McLane delivery dates for This Week match the database', async ({
		page,
		testData,
	}) => {
		useCase(TC.compareCurrentWeek);
		const expectedDates = await getExpectedThisWeekDates(testData);
		const vendorPage = new VendorSetupPage(page);
		await openDeliveryDates(page, vendorPage);

		const actualDates = await vendorPage.getDeliveryDateTextsForStore(STORE_NAME);
		expect(normalizeAndSortDates(actualDates, 'ui')).toEqual(normalizeAndSortDates(expectedDates, 'database'));
	});

	test('TC_RCSP-177_02 - This Week excludes dates outside the current week', async ({
		page,
		testData,
	}) => {
		useCase(TC.excludeOutsideWeek);
		const expectedDates = await getExpectedThisWeekDates(testData);
		const outsideWeekDates = await testData.getVendorDeliveryDatesOutsideCurrentWeek(STORE_ID, VENDOR_ID);
		if (outsideWeekDates.length === 0) {
			test.info().annotations.push({
				type: 'Data condition',
				description: 'No delivery-date records exist outside the current week for this store and vendor.',
			});
		}

		const vendorPage = new VendorSetupPage(page);
		await openDeliveryDates(page, vendorPage);
		const actualDates = await vendorPage.getDeliveryDateTextsForStore(STORE_NAME);
		const actualNormalized = normalizeAndSortDates(actualDates, 'ui');
		const expectedNormalized = normalizeAndSortDates(expectedDates, 'database');
		expect(actualNormalized).toEqual(expectedNormalized);

		const outsideNormalized = normalizeAndSortDates(outsideWeekDates, 'database');
		expect(actualNormalized.filter((date) => outsideNormalized.includes(date))).toEqual([]);

		const week = currentWeekBounds();
		const outOfRangeDates = actualNormalized.filter((date) => {
			const key = dateSortKey(date);
			return key < week.start || key >= week.end;
		});
		expect(outOfRangeDates, 'This Week results must stay within the current Monday-to-Sunday window').toEqual([]);
	});
});
