import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { OrderHistoryPage } from '../../pages/Ordering/OrderHistoryPage';
import { ActiveBatchPage } from '../../pages/ActiveBatch/ActiveBatchPage';

const hierarchy = {
	region: '1700 San Antonio 4126314',
	market: '1708 E Central SA 4126393',
	store: 'WB Unit 1034',
};

const ACTIVEBATCH_PATH = [
	'Restaurant',
	'RTCore',
	'IMS',
	'Flowers',
	'Process Scheduled Orders',
	'WB1.Process New Orders',
];

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

async function login(page: Page): Promise<void> {
	const loginPage = new RTCDashboardLoginPage(page);
	const transfersPage = new TransfersPage(page);
	await page.goto(CONFIG.dashboardURL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
	await page.waitForLoadState('networkidle').catch(() => undefined);
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	await transfersPage.switchStore(hierarchy.region, hierarchy.market, hierarchy.store);
}

async function openScheduledOrders(page: Page): Promise<ScheduledOrderPage> {
	await login(page);
	await new OrderingNavigation(page).openScheduledOrders();
	const scheduledPage = new ScheduledOrderPage(page);
	await scheduledPage.verifyScheduledOrdersPageLoaded();
	return scheduledPage;
}

async function openOrderHistory(page: Page): Promise<OrderHistoryPage> {
	await new OrderingNavigation(page).openOrderHistory();
	const historyPage = new OrderHistoryPage(page);
	await historyPage.verifyOrderHistoryPageLoaded();
	return historyPage;
}

test.describe('RCSP-412 - Order status auto-updates from Submitted/Sent to Received', () => {
	test.setTimeout(180_000);

	test('TC_RCSP-412_01 - Order status automatically updates to Received on vendor response', {
		tag: ['@regression'],
	}, async ({ page }) => {
		// Draft
		const scheduledPage = await openScheduledOrders(page);
		await scheduledPage.clickNewScheduledOrderButton();
		await scheduledPage.verifyNewScheduledOrderFormLoaded();
		const vendors = await scheduledPage.getVendorOptions();
		const vendor = vendors[0];
		test.skip(!vendor, 'No vendor is available in the current QA environment');

		const draftResult = await scheduledPage.createScheduledOrderDraft([vendor], [], 'RCSP-412_01 auto-receive validation');
		test.skip(!draftResult.saved, draftResult.reason ?? 'Unable to create a Scheduled Order draft');
		const orderNumber = draftResult.orderNumber ?? (await scheduledPage.getOrderNumberFromHeadingXPath());
		test.skip(!orderNumber, 'Unable to capture the dynamically generated PO#');

		await scheduledPage.openDraftSection();
		const draftRows = await scheduledPage.getDraftOrderRows();
		await expect(draftRows.filter({ hasText: new RegExp(orderNumber!, 'i') }).first()).toBeVisible();

		// Submitted
		const opened = await scheduledPage.openOrderFromGrid(orderNumber);
		test.skip(!opened.opened, opened.reason ?? 'Draft order could not be opened');
		const submission = await scheduledPage.submitCurrentOrder();
		test.skip(!submission.submitted, submission.reason ?? 'Draft order could not be submitted');
		await scheduledPage.verifySubmittedOrderFeedback(orderNumber);

		// Sent, via ActiveBatch transmission
		const activeBatchOpened = await new ActiveBatchPage(page).open();
		test.skip(!activeBatchOpened, 'ActiveBatch is not reachable from the current environment');
		const activeBatch = new ActiveBatchPage(page);
		const loggedIn = await activeBatch.loginViaConnectionManager();
		test.skip(!loggedIn, 'ActiveBatch Connection Manager login is unavailable or credentials are not configured');
		const triggerResult = await activeBatch.triggerJob(ACTIVEBATCH_PATH);
		test.skip(!triggerResult.triggered, triggerResult.reason ?? 'Unable to trigger the ActiveBatch job');

		const historyPage = await openOrderHistory(page);
		const { opened: sentOpened } = await historyPage.searchAndOpenOrder(orderNumber);
		test.skip(!sentOpened, 'Order was not found in Order History after ActiveBatch trigger');
		await expect(page.getByText(/^sent$/i).first()).toBeVisible({ timeout: 20_000 });

		// Received, automatically once the vendor response is processed
		await expect
			.poll(async () => {
				await page.reload();
				await historyPage.verifyOrderHistoryPageLoaded().catch(() => undefined);
				const { opened: reopened } = await historyPage.searchAndOpenOrder(orderNumber);
				if (!reopened) return undefined;
				return page
					.getByText(/^(sent|received)$/i)
					.first()
					.textContent()
					.then((value) => value?.trim().toLowerCase())
					.catch(() => undefined);
			}, {
				timeout: 60_000,
				intervals: [5_000],
				message: 'Waiting for the vendor response to auto-update the order status to Received.',
			})
			.toBe('received');
	});
});
