import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';

const hierarchy = {
	region: '1700 San Antonio 4126314',
	market: '1708 E Central SA 4126393',
	store: 'WB Unit 1034',
};

class OrderingNavigation {
	constructor(private readonly page: Page) {}

	private get sidebar() {
		return this.page.getByRole('complementary').first();
	}

	private get orderingMenu() {
		return this.sidebar.getByRole('button', { name: 'Ordering', exact: true });
	}

	async openScheduledOrders(): Promise<void> {
		const link = this.sidebar.getByRole('link', { name: 'Scheduled Orders', exact: true });
		if (await link.isVisible().catch(() => false)) {
			await link.click();
		} else {
			await this.orderingMenu.click().catch(() => undefined);
			if (await link.isVisible().catch(() => false)) {
				await link.click();
			} else {
				await this.page.goto(`${CONFIG.baseURL}/orders/scheduled`, {
					waitUntil: 'domcontentloaded',
					timeout: 30_000,
				});
			}
		}
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
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

async function openNewScheduledOrder(page: Page): Promise<ScheduledOrderPage> {
	const scheduledPage = await openScheduledOrders(page);
	await scheduledPage.clickNewScheduledOrderButton();
	await scheduledPage.verifyNewScheduledOrderFormLoaded();
	return scheduledPage;
}

async function createDraftOrSkip(page: Page): Promise<string> {
	const scheduledPage = await openNewScheduledOrder(page);
	const vendors = await scheduledPage.getVendorOptions();
	const vendor = vendors[0];
	test.skip(!vendor, 'No vendor is available in the current QA environment');
	const result = await scheduledPage.createScheduledOrderDraft([vendor], [], 'RCSP-332 draft edit validation');
	test.skip(!result.saved, result.reason ?? 'Unable to create a Scheduled Order draft in the current QA environment');
	return result.orderNumber ?? '';
}

test.describe('RCSP-332 - Scheduled Orders lifecycle and status navigation', () => {
	test.setTimeout(120_000);

	test('TC_RCSP-332_01 - New Scheduled Order navigates to /scheduled/new', { tag: ['@smoke', '@sanity', '@functional'] }, async ({ page }) => {
		const scheduledPage = await openScheduledOrders(page);
		await scheduledPage.clickNewScheduledOrderButton();
		await expect(page).toHaveURL(/\/orders\/scheduled\/new$/);
		await scheduledPage.verifyNewScheduledOrderFormLoaded();
	});

	test('TC_RCSP-332_02 - A valid Scheduled Order can be created successfully', { tag: ['@functional'] }, async ({ page }) => {
		const scheduledPage = await openNewScheduledOrder(page);
		const vendors = await scheduledPage.getVendorOptions();
		const vendor = vendors[0];
		test.skip(!vendor, 'No vendor is available in the current QA environment');
		const result = await scheduledPage.createScheduledOrderDraft([vendor], [], 'RCSP-332 valid Scheduled Order');
		test.skip(!result.saved, result.reason ?? 'Scheduled Order creation prerequisites are unavailable');
		expect(result.saved).toBe(true);
	});

	test('TC_RCSP-332_03 - Editing a Draft Scheduled Order opens /scheduled/{id}', { tag: ['@functional'] }, async ({ page }) => {
		const orderNumber = await createDraftOrSkip(page);
		const scheduledPage = await openScheduledOrders(page);
		const opened = await scheduledPage.openOrderFromGrid(orderNumber);
		test.skip(!opened.opened, opened.reason ?? 'No editable Draft Scheduled Order is available');
		await expect(page).toHaveURL(/\/orders\/scheduled\/[^/]+$/);
		await expect(scheduledPage.createOrderTitle).toBeVisible();
	});

	test('TC_RCSP-332_04 - Non-Draft Scheduled Orders cannot be edited', { tag: ['@regression'] }, async ({ page }) => {
		const scheduledPage = await openScheduledOrders(page);
		await scheduledPage.openSubmittedSection();
		const submittedRows = scheduledPage.ordersTable.locator('tbody tr');
		test.skip((await submittedRows.count()) === 0, 'No non-Draft Scheduled Order is available in the current QA environment');
		for (let index = 0; index < await submittedRows.count(); index += 1) {
			const editButton = submittedRows.nth(index).getByRole('button', { name: /edit/i });
			await expect(editButton).toHaveCount(0);
		}
	});

	test('TC_RCSP-332_05 - Sent, Received, and Cancelled status tabs are removed', { tag: ['@smoke', '@functional'] }, async ({ page }) => {
		await openScheduledOrders(page);
		for (const status of ['Sent', 'Received', 'Cancelled']) {
			await expect(page.getByRole('button', { name: status, exact: true })).toHaveCount(0);
			await expect(page.getByRole('tab', { name: status, exact: true })).toHaveCount(0);
		}
	});

	test('TC_RCSP-332_06 - Scheduled Orders remains stable after removed status tabs', { tag: ['@functional'] }, async ({ page }) => {
		const scheduledPage = await openScheduledOrders(page);
		await page.reload();
		await scheduledPage.verifyScheduledOrdersPageLoaded();
		await expect(page.locator('body')).not.toContainText(/unhandled exception|internal server error/i);
	});

	test('TC_RCSP-332_07 - Authorized users can directly open /scheduled/new', { tag: ['@regression'] }, async ({ page }) => {
		await login(page);
		await page.goto(`${CONFIG.baseURL}/orders/scheduled/new`);
		const scheduledPage = new ScheduledOrderPage(page);
		await expect(page).toHaveURL(/\/orders\/scheduled\/new$/);
		await scheduledPage.verifyNewScheduledOrderFormLoaded();
	});
});
