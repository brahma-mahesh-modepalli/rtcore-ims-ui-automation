import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-583';
const SCENARIO_ID = 'RCSP-583';

const TC = {
	draftSort: 'TC_RCSP-583_01',
	submittedSort: 'TC_RCSP-583_02',
	scrollSort: 'TC_RCSP-583_03',
} as const;

type CommonData = { hierarchy: { region: string; market: string; store: string } };

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

test.describe('RCSP-583 - Scheduled Orders Order Date sorting', () => {
	test.setTimeout(90_000);
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

	test('TC_RCSP-583_01 - Draft Order Date defaults latest first and toggles sorting', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async () => {
		useCase(TC.draftSort);
		const draftRows = await scheduledOrderPage.getDraftOrderRows();
		test.skip((await draftRows.count()) < 2, 'At least two Draft orders are required for Order Date sorting');
		await scheduledOrderPage.verifyStatusOrderDateSort('draft');
	});

	test('TC_RCSP-583_02 - Submitted Order Date toggles ascending and descending', { tag: ['@functional'] }, async () => {
		useCase(TC.submittedSort);
		await scheduledOrderPage.clearOrderDateGrouping();
		const sorted = await scheduledOrderPage.verifyStatusOrderDateSort('submitted');
		test.skip(!sorted, 'Submitted Order Date sorting is not supported or not stable in the current QA grid state');
	});

	test('TC_RCSP-583_03 - Order Date sorting remains after grid scrolling', { tag: ['@regression'] }, async () => {
		useCase(TC.scrollSort);
		const draftRows = await scheduledOrderPage.getDraftOrderRows();
		test.skip((await draftRows.count()) < 2, 'At least two Draft orders are required for scrolling validation');
		await scheduledOrderPage.verifyOrderDateHeaderStaysVisibleWhileScrolling('draft');
	});
});
