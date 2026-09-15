import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { formatLocalDate } from '../../utils/testDates';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-278';
const SCENARIO_ID = 'RCSP-278';

const TC = {
	orderDateLabel: 'TC_RCSP-278_001',
	pastDatesBlocked: 'TC_RCSP-278_002',
	currentDate: 'TC_RCSP-278_003',
	futureDate: 'TC_RCSP-278_004',
} as const;

type CommonData = {
	hierarchy: { region: string; market: string; store: string };
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

function getOffset(testCaseId: string): number {
	return getScenarioTestCaseData<{ daysOffset: number }>(FILE_NAME, SCENARIO_ID, testCaseId).daysOffset;
}

function dateWithOffset(daysOffset: number): string {
	const date = new Date();
	date.setDate(date.getDate() + daysOffset);
	return formatLocalDate(date);
}

test.describe('RCSP-278 - Scheduled Order Date', () => {
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
		await scheduledOrderPage.clickNewScheduledOrderButton();
	});

	test('TC_RCSP-278_001 - Required Date is renamed to Order Date', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async () => {
		getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, TC.orderDateLabel);
		await scheduledOrderPage.verifyOrderDateLabel();
	});

	test('TC_RCSP-278_002 - Past dates are disabled for Order Date', { tag: ['@regression'] }, async () => {
		await scheduledOrderPage.verifyPastOrderDatesBlocked(
			dateWithOffset(0),
			dateWithOffset(getOffset(TC.pastDatesBlocked)),
		);
	});

	test('TC_RCSP-278_003 - Current date is selectable as Order Date', { tag: ['@functional'] }, async () => {
		await scheduledOrderPage.selectOrderDate(dateWithOffset(getOffset(TC.currentDate)));
	});

	test('TC_RCSP-278_004 - Future date is selectable as Order Date', { tag: ['@functional'] }, async () => {
		await scheduledOrderPage.selectOrderDate(dateWithOffset(getOffset(TC.futureDate)));
	});
});
