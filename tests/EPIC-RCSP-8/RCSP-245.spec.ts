import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-245';
const SCENARIO_ID = 'RCSP-245';

const TC = {
	submitFlowers: 'TC_RCSP-245_01',
	duplicateFlowersCreateAnyway: 'TC_RCSP-245_02',
	submitMcLane: 'TC_RCSP-245_03',
	duplicateFlowersCancel: 'TC_RCSP-245_04',
} as const;

type CommonData = {
	hierarchy: { region: string; market: string; store: string };
	flowersVendor: string;
	mcLaneVendor: string;
	quantity: string;
};

class DashboardPage {
	private readonly sidebar: ReturnType<import('@playwright/test').Page['getByRole']>;
	private readonly orderingMenu: ReturnType<import('@playwright/test').Page['getByRole']>;

	constructor(private readonly page: import('@playwright/test').Page) {
		this.sidebar = page.getByRole('complementary').first();
		this.orderingMenu = this.sidebar.getByRole('button', { name: /^Ordering$/i });
	}

	async openScheduledOrders(): Promise<void> {
		const link = this.sidebar.getByRole('link', { name: /^Scheduled Orders$/i });
		if (!(await link.isVisible().catch(() => false))) {
			await this.orderingMenu.click();
		}
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

function getCurrentOrderDate(): string {
	const date = new Date();
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, '0'),
		String(date.getDate()).padStart(2, '0'),
	].join('-');
}

test.describe('RCSP-245 - Scheduled Order submission and duplicate handling', () => {
	test.setTimeout(180_000);
	let scheduledOrderPage: ScheduledOrderPage;
	let common: CommonData;

	test.beforeEach(async ({ page }) => {
		common = getCommonData();
		const loginPage = new RTCDashboardLoginPage(page);
		const transfersPage = new TransfersPage(page);
		const dashboardPage = new DashboardPage(page);
		scheduledOrderPage = new ScheduledOrderPage(page);

		await page.goto(CONFIG.dashboardURL);
		await page.waitForLoadState('networkidle').catch(() => undefined);
		await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
		await transfersPage.switchStore(
			common.hierarchy.region,
			common.hierarchy.market,
			common.hierarchy.store,
		);
		await dashboardPage.openScheduledOrders();
		await scheduledOrderPage.verifyScheduledOrdersPageLoaded();
	});

	async function prepareFirstAvailableItem(vendor: string, testCaseId: string): Promise<string> {
		const context = await scheduledOrderPage.createNewScheduledOrderContext(
			[vendor],
			`${testCaseId} automated order`,
		);
		test.skip(!context.created, context.reason ?? `${vendor} has no orderable items in QA`);
		await scheduledOrderPage.selectOrderDate(getCurrentOrderDate());

		const items = await scheduledOrderPage.getItemDropdownOptions();
		test.skip(items.length === 0, `${vendor} has no items in its dropdown in QA`);
		const itemName = items[0];
		const added = await scheduledOrderPage.addItemsToOrder([
			{ itemName, quantity: common.quantity },
		]);
		expect(added.addedCount, added.reason).toBeGreaterThan(0);
		await scheduledOrderPage.verifyItemQuantity(itemName, common.quantity);
		return itemName;
	}

	async function verifySubmittedOrder(orderNumber: string): Promise<void> {
		await scheduledOrderPage.verifySubmittedOrderFeedback(orderNumber);
		await scheduledOrderPage.searchSubmittedOrders(orderNumber);
		const dateGroups = await scheduledOrderPage.getOrderDateGroupLabels();
		const today = new Date();
		const currentDateIsGrouped = dateGroups.some((label) => {
			const date = new Date(label);
			return !Number.isNaN(date.getTime()) &&
				date.getFullYear() === today.getFullYear() &&
				date.getMonth() === today.getMonth() &&
				date.getDate() === today.getDate();
		});
		expect(currentDateIsGrouped, 'Submitted order should be grouped under today\'s Order Date').toBeTruthy();
		const groupingCleared = await scheduledOrderPage.clearOrderDateGrouping();
		expect(groupingCleared, 'Expected to clear the Order Date grouping using its X control').toBeTruthy();
		await scheduledOrderPage.openSubmittedSection();
		await scheduledOrderPage.sortColumn(/order date|required date|delivery date/i, 'descending');
		await scheduledOrderPage.verifyOrderVisibleOnce(orderNumber);
	}

	async function submitOrder(vendor: string, testCaseId: string): Promise<string> {
		await prepareFirstAvailableItem(vendor, testCaseId);
		const result = await scheduledOrderPage.submitCurrentOrder();
		expect(result.submitted, result.reason).toBeTruthy();
		expect(result.orderNumber).toMatch(/^PO-/i);
		const orderNumber = result.orderNumber!;
		await verifySubmittedOrder(orderNumber);
		return orderNumber;
	}

	test('TC_RCSP-245_01 - Submit Flowers Baking Company order and locate its PO', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async () => {
		useCase(TC.submitFlowers);
		await submitOrder(common.flowersVendor, TC.submitFlowers);
	});

	test('TC_RCSP-245_02 - Accept the Possible Duplicate Order warning for Flowers', {
		tag: ['@functional'],
	}, async () => {
		useCase(TC.duplicateFlowersCreateAnyway);
		await prepareFirstAvailableItem(common.flowersVendor, TC.duplicateFlowersCreateAnyway);
		await scheduledOrderPage.openSubmissionConfirmation();
		await scheduledOrderPage.verifySubmissionConfirmation();
		await scheduledOrderPage.confirmSubmissionWithoutDuplicateHandling();

		const duplicateDisplayed = await scheduledOrderPage.waitForPossibleDuplicateOrder();
		test.skip(!duplicateDisplayed, 'Duplicate-order precondition was not met in this execution');
		const modalText = await scheduledOrderPage.verifyPossibleDuplicateOrderModal();
		expect(modalText).toMatch(/duplicate order/i);

		const result = await scheduledOrderPage.createAnywayFromDuplicateOrder();
		expect(result.submitted, result.reason).toBeTruthy();
		expect(result.orderNumber).toMatch(/^PO-/i);
		await verifySubmittedOrder(result.orderNumber!);
	});

	test('TC_RCSP-245_03 - Submit McLane Foodservice Inc order and locate its PO', {
		tag: ['@functional'],
	}, async () => {
		useCase(TC.submitMcLane);
		await submitOrder(common.mcLaneVendor, TC.submitMcLane);
	});

	test('TC_RCSP-245_04 - Cancel Possible Duplicate Order without submitting another PO', {
		tag: ['@regression'],
	}, async ({ page }) => {
		useCase(TC.duplicateFlowersCancel);
		await prepareFirstAvailableItem(common.flowersVendor, TC.duplicateFlowersCancel);
		await scheduledOrderPage.openSubmissionConfirmation();
		await scheduledOrderPage.verifySubmissionConfirmation();
		await scheduledOrderPage.confirmSubmissionWithoutDuplicateHandling();

		const duplicateDisplayed = await scheduledOrderPage.waitForPossibleDuplicateOrder();
		test.skip(!duplicateDisplayed, 'Duplicate-order precondition was not met; case is not applicable');
		const existingPo = await scheduledOrderPage.getPossibleDuplicateOrderNumber();
		expect(existingPo, 'Duplicate warning should identify the existing PO').toMatch(/^PO-/i);

		await scheduledOrderPage.cancelPossibleDuplicateOrder();
		await expect(page.getByText(/submitted to the vendor/i)).toHaveCount(0);
		await scheduledOrderPage.cancelNewOrder();
		await scheduledOrderPage.openSubmittedSection();
		await scheduledOrderPage.verifyOrderVisibleOnce(existingPo!);
	});
});
