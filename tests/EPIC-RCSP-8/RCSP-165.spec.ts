import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { formatLocalDate } from '../../utils/testDates';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-165';
const SCENARIO_ID = 'RCSP-165';

const TC = {
	landingDates: 'TC_RCSP-165_01',
	datePicker: 'TC_RCSP-165_02',
	vendorItems: 'TC_RCSP-165_03',
	manualQuantity: 'TC_RCSP-165_04',
} as const;

type CommonData = {
	hierarchy: { region: string; market: string; store: string };
	vendor: string;
	vendorId: number;
	noHistoryItem: string;
	manualQuantity: string;
};

class DashboardPage {
	private readonly sidebar: ReturnType<Page['getByRole']>;
	private readonly orderingMenu: ReturnType<Page['getByRole']>;

	constructor(private readonly page: Page) {
		this.sidebar = page.getByRole('complementary').first();
		this.orderingMenu = this.sidebar.getByRole('button', { name: 'Ordering' });
	}

	async openScheduledOrders(): Promise<void> {
		const link = this.sidebar.getByRole('link', { name: 'Scheduled Orders', exact: true });
		if (!(await link.isVisible().catch(() => false))) await this.orderingMenu.click();
		await expect(link).toBeVisible();
		await link.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}
}

function getCommonData(): CommonData {
	return getScenarioTestData<{ commonData: CommonData }>(FILE_NAME, SCENARIO_ID).commonData;
}

function useCase(id: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, id);
}

function dateOffset(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return formatLocalDate(date);
}

test.describe('RCSP-165 - Scheduled Order dates and vendor items', () => {
	test.setTimeout(120_000);
	let scheduledOrderPage: ScheduledOrderPage;

	test.beforeEach(async ({ page }) => {
		const common = getCommonData();
		const loginPage = new RTCDashboardLoginPage(page);
		const transfersPage = new TransfersPage(page);
		const dashboardPage = new DashboardPage(page);
		scheduledOrderPage = new ScheduledOrderPage(page);

		await page.goto(CONFIG.dashboardURL);
		await page.waitForLoadState('networkidle').catch(() => undefined);
		await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
		await transfersPage.switchStore(common.hierarchy.region, common.hierarchy.market, common.hierarchy.store);
		await dashboardPage.openScheduledOrders();
		await scheduledOrderPage.verifyScheduledOrdersPageLoaded();
	});

	test('TC_RCSP-165_01 - Landing orders display Order Date, cutoff, and Delivery Date', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async () => {
		useCase(TC.landingDates);
		await scheduledOrderPage.verifyLandingOrderDatesDeliveryDatesAndCutoff();
	});

	test('TC_RCSP-165_02 - Past dates are blocked and current/future dates selectable', { tag: ['@regression'] }, async () => {
		useCase(TC.datePicker);
		await scheduledOrderPage.clickNewScheduledOrderButton();
		await scheduledOrderPage.verifyPastOrderDatesBlocked(dateOffset(0), dateOffset(-1));
		await scheduledOrderPage.selectOrderDate(dateOffset(0));
		await scheduledOrderPage.selectOrderDate(dateOffset(1));
	});

	test('TC_RCSP-165_03 - Flowers item dropdown matches latest DB vendor items', { tag: ['@functional'] }, async ({ testData }) => {
		useCase(TC.vendorItems);
		const common = getCommonData();
		const expected = await testData.getLatestVendorItemsByVendorId(common.vendorId);
		expect(expected.length).toBeGreaterThan(0);
		await scheduledOrderPage.clickNewScheduledOrderButton();
		await scheduledOrderPage.selectVendor(common.vendor);
		const actualOptions = await scheduledOrderPage.getItemDropdownOptions();
		for (const item of expected) {
			expect(
				actualOptions.some((option) => option.toLowerCase().includes(item.vendor_item_name.toLowerCase())),
				`Expected vendor item in dropdown: ${item.vendor_item_name}`,
			).toBeTruthy();
		}
	});

	test('TC_RCSP-165_04 - No-history item starts at zero and accepts manual quantity', { tag: ['@functional'] }, async () => {
		useCase(TC.manualQuantity);
		const common = getCommonData();
		await scheduledOrderPage.clickNewScheduledOrderButton();
		await scheduledOrderPage.selectVendor(common.vendor);
		const available = await scheduledOrderPage.selectItemAndVerifyManualQuantity(
			common.noHistoryItem,
			common.manualQuantity,
		);
		test.skip(!available, `Configured no-history item is unavailable: ${common.noHistoryItem}`);
	});
});
