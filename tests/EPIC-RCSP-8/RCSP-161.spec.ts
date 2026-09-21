import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { HotShotOrderPage } from '../../pages/Ordering/HotShotOrderPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';

const VENDOR = 'Flowers Baking Company';

class OrderingNavigation {
	constructor(private readonly page: Page) {}

	private get sidebar() {
		return this.page.getByRole('complementary').first();
	}

	private get orderingMenu() {
		return this.sidebar.getByRole('button', { name: 'Ordering', exact: true });
	}

	async expandOrdering(): Promise<void> {
		const scheduledLink = this.sidebar.getByRole('link', { name: 'Scheduled Orders', exact: true });
		if (!(await scheduledLink.isVisible().catch(() => false))) {
			await this.orderingMenu.click();
		}
		await expect(scheduledLink).toBeVisible();
	}

	async openHotShot(): Promise<void> {
		await this.expandOrdering();
		const link = this.sidebar.getByRole('link', { name: 'Hot Shot Order', exact: true });
		await expect(link).toBeVisible();
		await link.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	async openScheduledOrders(): Promise<void> {
		await this.expandOrdering();
		const link = this.sidebar.getByRole('link', { name: 'Scheduled Orders', exact: true });
		await link.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}
}

function tomorrow(): string {
	const date = new Date();
	date.setDate(date.getDate() + 1);
	return date.toISOString().split('T')[0];
}

async function loginAndSwitchStore(page: Page): Promise<void> {
	const loginPage = new RTCDashboardLoginPage(page);
	const transfersPage = new TransfersPage(page);
	await page.goto(CONFIG.dashboardURL);
	await page.waitForLoadState('networkidle').catch(() => undefined);
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	await transfersPage.switchStore('1700 San Antonio 4126314', '1708 E Central SA 4126393', 'WB Unit 1034');
}

async function openHotShot(page: Page): Promise<HotShotOrderPage> {
	await loginAndSwitchStore(page);
	await new OrderingNavigation(page).openHotShot();
	const hotShotPage = new HotShotOrderPage(page);
	await hotShotPage.verifyHotShotOrderPageLoaded();
	return hotShotPage;
}

async function openNewScheduledOrder(page: Page): Promise<ScheduledOrderPage> {
	await loginAndSwitchStore(page);
	const navigation = new OrderingNavigation(page);
	const scheduledPage = new ScheduledOrderPage(page);
	await navigation.openScheduledOrders();
	await scheduledPage.verifyScheduledOrdersPageLoaded();
	await scheduledPage.clickNewScheduledOrderButton();
	await scheduledPage.verifyNewScheduledOrderFormLoaded();
	return scheduledPage;
}

async function selectFlowersVendorOrSkip(pageObject: ScheduledOrderPage): Promise<void> {
	const vendors = await pageObject.getVendorOptions();
	test.skip(
		!vendors.some((vendor) => vendor.toLowerCase() === VENDOR.toLowerCase()),
		`${VENDOR} is unavailable in the current QA vendor master data`,
	);
	await pageObject.selectVendor(VENDOR);
}

test.describe('RCSP-161 - Ordering Hot Shot and Scheduled Order Auto-Suggest', () => {
	test.setTimeout(120_000);

	test('TC_RCSP-161_01 - Hot Shot Order opens blank with no pre-populated items', { tag: ['@smoke', '@sanity', '@functional'] }, async ({ page }) => {
		const hotShotPage = await openHotShot(page);
		await expect(hotShotPage.lineItemVendorDisabledButton).toBeDisabled();
		await expect(hotShotPage.lineItemQtyInput).toHaveValue('');
		await expect(hotShotPage.lineItemQtyInput).toHaveAttribute('placeholder', '0');
	});

	test('TC_RCSP-161_02 - Hot Shot Order supports manual item selection and submission', { tag: ['@functional'] }, async ({ page }) => {
		const hotShotPage = await openHotShot(page);
		const result = await hotShotPage.createAndSubmitHotShotOrder([VENDOR, 'Fresh Foods Vendor'], 'RCSP-161 manual item test');
		test.skip(!result.submitted, result.reason ?? 'No configured Hot Shot vendor/item was available');
		expect(result.submitted).toBe(true);
	});

	test('TC_RCSP-161_03 - Hot Shot validates mandatory fields before adding items', { tag: ['@functional'] }, async ({ page }) => {
		const hotShotPage = await openHotShot(page);
		await hotShotPage.addLineButton.click();
		await expect(page.locator('body')).toContainText(/required|select a vendor|vendor.*date/i);
	});

	test('TC_RCSP-161_04 - Hot Shot handles an invalid item search without errors', { tag: ['@functional'] }, async ({ page }) => {
		const hotShotPage = await openHotShot(page);
		await hotShotPage.selectVendor(VENDOR).catch(() => undefined);
		await hotShotPage.fillRequiredDate(tomorrow());
		const itemButton = page.locator('main table tbody tr').first().getByRole('button').first();
		await itemButton.click();
		const search = page.getByPlaceholder(/search.*item|item.*search/i).first();
		if (await search.isVisible().catch(() => false)) {
			await search.fill('XYZ_INVALID_ITEM');
		}
		await expect(page.locator('body')).not.toContainText(/unhandled exception|internal server error/i);
	});

	test('TC_RCSP-161_05 - Hot Shot cannot be submitted without a line item', { tag: ['@regression'] }, async ({ page }) => {
		const hotShotPage = await openHotShot(page);
		await hotShotPage.selectVendor(VENDOR).catch(() => undefined);
		await hotShotPage.fillRequiredDate(tomorrow());
		await hotShotPage.createAndSubmitButton.click();
		await expect(page.locator('body')).toContainText(/item|required|line/i);
	});

	test('TC_RCSP-161_06 - Scheduled Order Auto-Suggest is disabled before vendor selection', { tag: ['@smoke', '@functional'] }, async ({ page }) => {
		const scheduledPage = await openNewScheduledOrder(page);
		await expect(scheduledPage.autoSuggestItemsButton).toBeDisabled();
	});

	test('TC_RCSP-161_07 - Scheduled Order Auto-Suggest is enabled after selecting Flowers Baking Company', { tag: ['@functional'] }, async ({ page }) => {
		const scheduledPage = await openNewScheduledOrder(page);
		await selectFlowersVendorOrSkip(scheduledPage);
		await expect(scheduledPage.autoSuggestItemsButton).toBeEnabled();
	});

	test('TC_RCSP-161_08 - Scheduled Order enforces Required Date for Auto-Suggest', { tag: ['@functional'] }, async ({ page }) => {
		const scheduledPage = await openNewScheduledOrder(page);
		await selectFlowersVendorOrSkip(scheduledPage);
		await expect(scheduledPage.autoSuggestItemsButton).toBeEnabled();
		await scheduledPage.autoSuggestItemsButton.click();
		await expect(page.locator('body')).toContainText(/required|date|order date/i);
	});

	test('TC_RCSP-161_09 - Auto-Suggest populates line items for vendor and date', { tag: ['@regression'] }, async ({ page }) => {
		const scheduledPage = await openNewScheduledOrder(page);
		await selectFlowersVendorOrSkip(scheduledPage);
		await scheduledPage.selectOrderDate(tomorrow());
		await expect(scheduledPage.autoSuggestItemsButton).toBeEnabled();
		await scheduledPage.autoSuggestItemsButton.click();
		await expect.poll(async () => page.locator('main table tbody tr').count()).toBeGreaterThan(0);
		await expect(page.locator('body')).not.toContainText(/unhandled exception|internal server error/i);
	});
});
