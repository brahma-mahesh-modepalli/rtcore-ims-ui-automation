import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-39';
const SCENARIO_ID = 'RCSP-39';

const TC = {
	notesAndSearch: 'TC_RCSP-39_01',
	quantityAndColumns: 'TC_RCSP-39_02',
	removeLine: 'TC_RCSP-39_03',
} as const;

type CommonData = {
	hierarchy: { region: string; market: string; store: string };
	vendor: string;
	item: string;
	quantity: string;
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

function getCaseData<T>(id: string): T {
	return getScenarioTestCaseData<T>(FILE_NAME, SCENARIO_ID, id);
}

test.describe('RCSP-39 - Scheduled Order form fields and line items', () => {
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
		await scheduledOrderPage.clickNewScheduledOrderButton();
		await scheduledOrderPage.verifyNewScheduledOrderFormLoaded();
	});

	async function addConfiguredItem(): Promise<CommonData> {
		const common = getCommonData();
		await scheduledOrderPage.selectVendor(common.vendor);
		const result = await scheduledOrderPage.addItemsToOrder([
			{ itemName: common.item, quantity: common.quantity },
		]);
		expect(result.addedCount, result.reason).toBeGreaterThan(0);
		return common;
	}

	test('TC_RCSP-39_01 - Notes placeholder and item search accept text', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async () => {
		const data = getCaseData<{ notes: string; search: string }>(TC.notesAndSearch);
		await scheduledOrderPage.verifyNotesAndItemSearch(data.notes, data.search);
	});

	test('TC_RCSP-39_02 - Qty to Order input and line item columns are displayed', { tag: ['@functional'] }, async () => {
		getCaseData<Record<string, never>>(TC.quantityAndColumns);
		const common = await addConfiguredItem();
		await scheduledOrderPage.verifyLineItemColumns();
		await scheduledOrderPage.verifyItemQuantity(common.item, common.quantity);
	});

	test('TC_RCSP-39_03 - Selected line item can be removed', { tag: ['@regression'] }, async () => {
		getCaseData<Record<string, never>>(TC.removeLine);
		const common = await addConfiguredItem();
		await scheduledOrderPage.removeLineItem(common.item);
	});
});
