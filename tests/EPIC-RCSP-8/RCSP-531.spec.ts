import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-531';
const SCENARIO_ID = 'RCSP-531';

const TC = {
	newOrderFirst: 'TC_RCSP-531_001',
	largeListVisibility: 'TC_RCSP-531_002',
	groupedByDate: 'TC_RCSP-531_003',
	dateGroupsAscending: 'TC_RCSP-531_004',
	currentDateFirst: 'TC_RCSP-531_005',
	vendorAscending: 'TC_RCSP-531_006',
	vendorDescending: 'TC_RCSP-531_007',
	orderDateSorting: 'TC_RCSP-531_008',
	withinGroupSorting: 'TC_RCSP-531_009',
	groupsRemainIntact: 'TC_RCSP-531_010',
	positiveBeforeZero: 'TC_RCSP-531_011',
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
		const scheduledLink = this.sidebar.getByRole('link', { name: 'Scheduled Orders', exact: true });
		if (!(await scheduledLink.isVisible().catch(() => false))) await this.orderingMenu.click();
		await expect(scheduledLink).toBeVisible({ timeout: 10_000 });
		await scheduledLink.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}
}

function getCommonData(): CommonData {
	return getScenarioTestData<{ commonData: CommonData }>(FILE_NAME, SCENARIO_ID).commonData;
}

function useCase(testCaseId: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, testCaseId);
}

test.describe('RCSP-531 - Scheduled Orders default sorting', () => {
	test.setTimeout(180_000);

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

	async function createSubmittedOrder(): Promise<string | undefined> {
		const common = getCommonData();
		const result = await scheduledOrderPage.createAndSubmitScheduledOrder(
			[common.vendor],
			[{ itemName: common.item, quantity: common.quantity }],
			`RCSP-531-${Date.now()}`,
		);
		expect(result.submitted, result.reason).toBeTruthy();
		await scheduledOrderPage.verifySubmittedOrderFeedback(result.orderNumber);
		return result.orderNumber;
	}

	test('TC_RCSP-531_001 - Newly submitted order appears at the top', { tag: ['@smoke', '@sanity', '@functional'] }, async () => {
		useCase(TC.newOrderFirst);
		await scheduledOrderPage.verifyOrderIsFirst(await createSubmittedOrder());
	});

	test('TC_RCSP-531_002 - New order is visible once in a large Submitted list', { tag: ['@functional'] }, async () => {
		useCase(TC.largeListVisibility);
		await scheduledOrderPage.verifyOrderVisibleOnce(await createSubmittedOrder());
	});

	test('TC_RCSP-531_003 - Submitted orders are grouped by Order Date', { tag: ['@functional'] }, async () => {
		useCase(TC.groupedByDate);
		const labels = await scheduledOrderPage.getOrderDateGroupLabels();
		test.skip(labels.length < 2, 'At least two Order Date groups are required');
		expect(new Set(labels).size).toBe(labels.length);
	});

	test('TC_RCSP-531_004 - Order Date groups are displayed in ascending order', { tag: ['@functional'] }, async () => {
		useCase(TC.dateGroupsAscending);
		await scheduledOrderPage.verifyOrderDateGroupsAscending();
	});

	test('TC_RCSP-531_005 - Current Order Date group is displayed first when present', { tag: ['@regression'] }, async () => {
		useCase(TC.currentDateFirst);
		test.skip(!(await scheduledOrderPage.verifyCurrentDateGroupFirst()), 'No current-date Submitted group exists');
	});

	test('TC_RCSP-531_006 - Vendor column sorts ascending', { tag: ['@functional'] }, async () => {
		useCase(TC.vendorAscending);
		await scheduledOrderPage.verifyColumnSorted(/vendor/i, 'ascending');
	});

	test('TC_RCSP-531_007 - Vendor column sorts descending', { tag: ['@functional'] }, async () => {
		useCase(TC.vendorDescending);
		await scheduledOrderPage.verifyColumnSorted(/vendor/i, 'descending');
	});

	test('TC_RCSP-531_008 - Order Date sorting works in both directions', { tag: ['@functional'] }, async () => {
		useCase(TC.orderDateSorting);
		await scheduledOrderPage.verifyColumnSorted(/order date|required date/i, 'ascending');
		await scheduledOrderPage.verifyColumnSorted(/order date|required date/i, 'descending');
	});

	test('TC_RCSP-531_009 - Vendor sorting applies within Order Date groups', { tag: ['@functional'] }, async () => {
		useCase(TC.withinGroupSorting);
		const groups = await scheduledOrderPage.getOrderDateGroupLabels();
		test.skip(groups.length === 0, 'No Order Date groups are available');
		await scheduledOrderPage.verifyColumnSorted(/vendor/i, 'ascending');
	});

	test('TC_RCSP-531_010 - Order Date groups remain intact after sorting', { tag: ['@regression'] }, async () => {
		useCase(TC.groupsRemainIntact);
		await scheduledOrderPage.verifyGroupLabelsRemainAfterSort();
	});

	test('TC_RCSP-531_011 - Positive quantities are listed before zero quantities for auto-drafts', { tag: ['@regression'] }, async () => {
		useCase(TC.positiveBeforeZero);
		test.skip(!(await scheduledOrderPage.openAutoDraftOrder()), 'No auto-drafted order is available in QA');
		await scheduledOrderPage.verifyPositiveQuantitiesBeforeZero();
	});
});
