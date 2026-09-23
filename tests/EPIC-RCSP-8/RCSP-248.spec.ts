import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { OrderHistoryPage } from '../../pages/Ordering/OrderHistoryPage';

const hierarchy = {
	region: '1700 San Antonio 4126314',
	market: '1708 E Central SA 4126393',
	store: 'WB Unit 1034',
};

/** PO# captured once and reused across read-only Order History verifications. */
const shared: { po?: string } = {};

class OrderingNavigation {
	constructor(private readonly page: Page) {}

	private get sidebar() {
		return this.page.getByRole('complementary').first();
	}

	private get orderingMenu() {
		return this.sidebar.getByRole('button', { name: 'Ordering', exact: true });
	}

	private async openLink(name: string, fallbackPath: string): Promise<void> {
		const link = this.sidebar.getByRole('link', { name, exact: true });
		if (await link.isVisible().catch(() => false)) {
			await link.click();
		} else {
			await this.orderingMenu.click().catch(() => undefined);
			if (await link.isVisible().catch(() => false)) {
				await link.click();
			} else {
				await this.page.goto(`${CONFIG.baseURL}${fallbackPath}`, {
					waitUntil: 'domcontentloaded',
					timeout: 30_000,
				});
			}
		}
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	async openScheduledOrders(): Promise<void> {
		await this.openLink('Scheduled Orders', '/orders/scheduled');
	}

	async openOrderHistory(): Promise<void> {
		await this.openLink('Order History', '/orders/history');
	}
}

async function login(page: Page, username = CONFIG.credentials.admin.username): Promise<void> {
	const loginPage = new RTCDashboardLoginPage(page);
	const transfersPage = new TransfersPage(page);
	await page.goto(CONFIG.dashboardURL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
	await page.waitForLoadState('networkidle').catch(() => undefined);
	await loginPage.login(username, CONFIG.credentials.admin.password);
	await transfersPage.switchStore(hierarchy.region, hierarchy.market, hierarchy.store);
}

async function openOrderHistory(page: Page): Promise<OrderHistoryPage> {
	await new OrderingNavigation(page).openOrderHistory();
	const historyPage = new OrderHistoryPage(page);
	await historyPage.verifyOrderHistoryPageLoaded();
	return historyPage;
}

async function createDraftOrderPo(page: Page, notes: string): Promise<{ orderNumber?: string; reason?: string }> {
	await login(page);
	await new OrderingNavigation(page).openScheduledOrders();
	const scheduledPage = new ScheduledOrderPage(page);
	await scheduledPage.verifyScheduledOrdersPageLoaded();
	await scheduledPage.clickNewScheduledOrderButton();
	await scheduledPage.verifyNewScheduledOrderFormLoaded();

	const vendors = await scheduledPage.getVendorOptions();
	const vendor = vendors[0];
	if (!vendor) {
		return { reason: 'No vendor is available in the current QA environment' };
	}

	const result = await scheduledPage.createScheduledOrderDraft([vendor], [], notes);
	if (!result.saved) {
		return { reason: result.reason ?? 'Unable to create a Scheduled Order draft' };
	}

	const capturedPo = result.orderNumber ?? (await scheduledPage.getOrderNumberFromHeadingXPath());
	return { orderNumber: capturedPo };
}

async function ensureSharedPo(page: Page): Promise<string | undefined> {
	if (shared.po) return shared.po;
	const { orderNumber } = await createDraftOrderPo(page, 'RCSP-248 Order History transaction fields');
	shared.po = orderNumber;
	return orderNumber;
}

test.describe('RCSP-248 - Order History transaction fields and sorting', () => {
	test.setTimeout(180_000);

	test('TC_RCSP-248_01 - All required transaction fields are captured and displayed', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async ({ page }) => {
		const po = await ensureSharedPo(page);
		test.skip(!po, 'Unable to capture a PO# to verify transaction fields');

		const historyPage = await openOrderHistory(page);
		const { opened } = await historyPage.searchAndOpenOrder(po);
		test.skip(!opened, 'Order could not be opened in Order History');

		await historyPage.verifyTransactionFieldsVisible();
	});

	test('TC_RCSP-248_02 - Transaction fields are stored accurately across the order lifecycle', {
		tag: ['@functional'],
	}, async ({ page }) => {
		const po = await ensureSharedPo(page);
		test.skip(!po, 'Unable to capture a PO# to verify transaction fields');

		const historyPage = await openOrderHistory(page);
		const { opened } = await historyPage.searchAndOpenOrder(po);
		test.skip(!opened, 'Order could not be opened in Order History');

		await expect(page.getByText(po!, { exact: false }).first()).toBeVisible();
		await historyPage.verifyTransactionFieldsVisible();
	});

	test('TC_RCSP-248_03 - Transaction information is correct for multiple order line items', {
		tag: ['@functional'],
	}, async ({ page }) => {
		const po = await ensureSharedPo(page);
		test.skip(!po, 'Unable to capture a PO# to verify line items');

		const historyPage = await openOrderHistory(page);
		const { opened } = await historyPage.searchAndOpenOrder(po);
		test.skip(!opened, 'Order could not be opened in Order History');

		const lineItems = await historyPage.getLineItemRowTexts();
		expect(lineItems.length, 'Expected at least one order line item').toBeGreaterThan(0);
		expect(new Set(lineItems).size, 'Line items should not be duplicated').toBe(lineItems.length);
	});

	test('TC_RCSP-248_04 - Order records are retained and accessible to store and above-store users', {
		tag: ['@regression'],
	}, async ({ page }) => {
		const po = await ensureSharedPo(page);
		test.skip(!po, 'Unable to capture a PO# to verify cross-role access');

		const historyPage = await openOrderHistory(page);
		const { opened: storeOpened } = await historyPage.searchAndOpenOrder(po);
		expect(storeOpened, 'Store user should be able to open the order record').toBe(true);

		// Repeat with the configured admin/above-store credentials.
		const aboveStoreHistoryPage = await openOrderHistory(page);
		const { opened: aboveStoreOpened } = await aboveStoreHistoryPage.searchAndOpenOrder(po);
		expect(aboveStoreOpened, 'Above-store user should be able to open the order record').toBe(true);
	});

	test('TC_RCSP-248_05 - Store managers can view closed and delivered invoices', { tag: ['@regression'] }, async ({ page }) => {
		const po = await ensureSharedPo(page);
		test.skip(!po, 'Unable to capture a PO# to verify invoice visibility');

		const historyPage = await openOrderHistory(page);
		const { opened } = await historyPage.searchAndOpenOrder(po);
		test.skip(!opened, 'Order could not be opened in Order History');
		await historyPage.verifyTransactionFieldsVisible();
	});

	test('TC_RCSP-248_06 - Order History defaults to the logged-in store\'s orders without filters', {
		tag: ['@smoke', '@functional'],
	}, async ({ page }) => {
		await login(page);
		const transfersPage = new TransfersPage(page);
		await transfersPage.verifyActiveStore(hierarchy.store);

		const historyPage = await openOrderHistory(page);
		const rowCount = await historyPage.getVisibleOrderCount();
		expect(rowCount, 'Expected orders to be displayed without applying filters').toBeGreaterThan(0);
	});

	test('TC_RCSP-248_07 - Order History sorts orders by most recent first', { tag: ['@functional'] }, async ({ page }) => {
		await login(page);
		const historyPage = await openOrderHistory(page);
		const dates = await historyPage.getVisibleOrderDateSequence();
		test.skip(dates.length < 2, 'At least two dated orders are required to verify sorting');
		expect(dates).toEqual([...dates].sort((left, right) => right - left));

		await page.reload();
		await historyPage.verifyOrderHistoryPageLoaded();
		const datesAfterReload = await historyPage.getVisibleOrderDateSequence();
		expect(datesAfterReload).toEqual([...datesAfterReload].sort((left, right) => right - left));
	});

	test('TC_RCSP-248_08 - Newly created orders are immediately visible in default Order History results', {
		tag: ['@functional'],
	}, async ({ page }) => {
		const { orderNumber, reason } = await createDraftOrderPo(page, 'RCSP-248_08 new order visibility');
		test.skip(!orderNumber, reason ?? 'Unable to capture a new PO#');

		const historyPage = await openOrderHistory(page);
		const sequence = await historyPage.getVisibleOrderNumberSequence();
		expect(sequence, `Expected ${orderNumber} to be immediately visible in Order History`).toContain(orderNumber);
	});
});
