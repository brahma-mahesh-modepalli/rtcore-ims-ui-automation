import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-580';
const SCENARIO_ID = 'RCSP-580';

const TC = {
	confirmYes: 'TC_RCSP-580_001',
	confirmNo: 'TC_RCSP-580_002',
	popupContent: 'TC_RCSP-580_003',
	mandatoryValidation: 'TC_RCSP-580_004',
	duplicateProtection: 'TC_RCSP-580_005',
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

function useCase(id: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, id);
}

test.describe('RCSP-580 - Scheduled Order submission confirmation', () => {
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

	async function prepareValidOrder(): Promise<CommonData> {
		const common = getCommonData();
		const context = await scheduledOrderPage.createNewScheduledOrderContext(
			[common.vendor],
			`RCSP-580-${Date.now()}`,
			[{ itemName: common.item, quantity: common.quantity }],
		);
		expect(context.created, context.reason).toBeTruthy();
		const added = await scheduledOrderPage.addItemsToOrder([
			{ itemName: common.item, quantity: common.quantity },
		]);
		expect(added.addedCount, added.reason).toBeGreaterThan(0);
		return common;
	}

	test('TC_RCSP-580_001 - Confirm Yes submits the Scheduled Order', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async () => {
		useCase(TC.confirmYes);
		await prepareValidOrder();
		await scheduledOrderPage.openSubmissionConfirmation();
		await scheduledOrderPage.verifySubmissionConfirmation();
		const result = await scheduledOrderPage.confirmSubmission();
		expect(result.submitted, result.reason).toBeTruthy();
		await scheduledOrderPage.verifySubmittedOrderFeedback(result.orderNumber);
	});

	test('TC_RCSP-580_002 - Confirm No closes popup and retains order data', { tag: ['@regression'] }, async () => {
		useCase(TC.confirmNo);
		const common = await prepareValidOrder();
		await scheduledOrderPage.openSubmissionConfirmation();
		await scheduledOrderPage.cancelSubmissionConfirmation();
		await scheduledOrderPage.verifyOrderDataRetained(common.vendor, common.item, common.quantity);
	});

	test('TC_RCSP-580_003 - Confirmation popup content and controls are correct', { tag: ['@functional'] }, async () => {
		useCase(TC.popupContent);
		await prepareValidOrder();
		await scheduledOrderPage.openSubmissionConfirmation();
		await scheduledOrderPage.verifySubmissionConfirmation();
		await scheduledOrderPage.cancelSubmissionConfirmation();
	});

	test('TC_RCSP-580_004 - Incomplete mandatory details prevent confirmation', { tag: ['@regression'] }, async () => {
		useCase(TC.mandatoryValidation);
		await scheduledOrderPage.clickNewScheduledOrderButton();
		await scheduledOrderPage.verifyIncompleteSubmissionBlocked();
	});

	test('TC_RCSP-580_005 - Repeated submit actions create only one order', { tag: ['@regression'] }, async ({ page }) => {
		useCase(TC.duplicateProtection);
		await prepareValidOrder();
		await scheduledOrderPage.openSubmissionConfirmation();
		const result = await scheduledOrderPage.confirmSubmission();
		expect(result.submitted, result.reason).toBeTruthy();
		await expect(page.getByRole('button', { name: 'Create & Submit', exact: true })).toHaveCount(0);
		await scheduledOrderPage.verifyOrderVisibleOnce(result.orderNumber);
	});
});
