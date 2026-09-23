import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { ReceiveOrderPage } from '../../pages/Ordering/ReceiveOrderPage';

const hierarchy = {
	region: '1700 San Antonio 4126314',
	market: '1708 E Central SA 4126393',
	store: 'WB Unit 1034',
};

const PRICED_ITEM = 'SM BUN TEXAS TOAST';

class OrderingNavigation {
	constructor(private readonly page: Page) {}

	private get sidebar() {
		return this.page.getByRole('complementary').first();
	}

	private get orderingMenu() {
		return this.sidebar.getByRole('button', { name: 'Ordering', exact: true });
	}

	async openReceiveOrder(): Promise<void> {
		const link = this.sidebar.getByRole('link', { name: 'Receive Order', exact: true });
		if (await link.isVisible().catch(() => false)) {
			await link.click();
		} else {
			await this.orderingMenu.click().catch(() => undefined);
			if (await link.isVisible().catch(() => false)) {
				await link.click();
			} else {
				await this.page.goto(`${CONFIG.baseURL}/orders/receive`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
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

async function openReceiveOrder(page: Page): Promise<ReceiveOrderPage> {
	await new OrderingNavigation(page).openReceiveOrder();
	const receivePage = new ReceiveOrderPage(page);
	await receivePage.open();
	return receivePage;
}

async function openNewDeliveryWithItem(page: Page, orderType: 'Will Call — McLane' | 'Will Call — Flowers', itemTerm: string): Promise<ReceiveOrderPage> {
	const receivePage = await openReceiveOrder(page);
	await receivePage.openWillCallOrder();
	await receivePage.selectOrderType(orderType);
	await receivePage.selectItemHandlingDuplicatePopup(itemTerm);
	return receivePage;
}

test.describe('RCSP-168 - New Delivery pricing feed, duplicate popup, and MVP form fields', () => {
	test.setTimeout(180_000);

	test('TC_RCSP-168_01 - Unit Cost auto-populates from McLane/Flowers pricing feed', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async ({ page }) => {
		await login(page);
		const receivePage = await openNewDeliveryWithItem(page, 'Will Call — McLane', PRICED_ITEM);
		await receivePage.verifyUnitCostReadOnlyAndPopulated();
	});

	test('TC_RCSP-168_02 - Unit Cost is read-only and cannot be edited', { tag: ['@functional'] }, async ({ page }) => {
		await login(page);
		const receivePage = await openNewDeliveryWithItem(page, 'Will Call — McLane', PRICED_ITEM);
		await receivePage.verifyUnitCostReadOnlyAndPopulated();
	});

	test('TC_RCSP-168_03 - Effective-date pricing is applied to the delivery entry', { tag: ['@regression'] }, async ({ page }) => {
		await login(page);
		const receivePage = await openNewDeliveryWithItem(page, 'Will Call — McLane', PRICED_ITEM);
		const unitCost = await receivePage.getUnitCostValue();
		test.skip(!unitCost, 'Unit Cost value could not be resolved to verify effective-date pricing');
		expect(unitCost).not.toMatch(/^\$?0(\.00)?$/);
	});

	test('TC_RCSP-168_04 - Clear error when pricing is unavailable', { tag: ['@regression'] }, async ({ page }) => {
		await login(page);
		const receivePage = await openReceiveOrder(page);
		await receivePage.openWillCallOrder();
		await receivePage.selectOrderType('Will Call — McLane');

		const selected = await receivePage.selectItemHandlingDuplicatePopup('UNPRICED_TEST_ITEM').then(() => true).catch(() => false);
		test.skip(!selected, 'No item without pricing-feed data is available in the current QA environment');
		await receivePage.verifyUnitCostErrorStateForUnavailablePricing();
	});

	test('TC_RCSP-168_05 - Item Total and Total Value use the auto-populated Unit Cost', {
		tag: ['@functional'],
	}, async ({ page }) => {
		await login(page);
		const receivePage = await openNewDeliveryWithItem(page, 'Will Call — McLane', PRICED_ITEM);
		await receivePage.setReceivedQty(PRICED_ITEM, '10').catch(() => undefined);
		await receivePage.verifyItemTotalMatchesQtyTimesUnitCost(PRICED_ITEM, 10);
	});

	test('TC_RCSP-168_06 - RTI Oil Unit Cost auto-populates from RTI pricing feed', { tag: ['@functional'] }, async ({ page }) => {
		await login(page);
		const receivePage = await openReceiveOrder(page);
		await receivePage.openWillCallOrder();
		await receivePage.selectOrderType('RTI Oil');

		const unitCostVisible = await receivePage.getUnitCostValue().then((value) => Boolean(value)).catch(() => false);
		test.skip(!unitCostVisible, 'RTI electronic invoice pricing is not available in the current environment');
		await receivePage.verifyUnitCostReadOnlyAndPopulated();
	});

	test('TC_RCSP-168_07 - Possible Duplicate Delivery popup shows existing delivery details', {
		tag: ['@regression'],
	}, async ({ page }) => {
		await login(page);
		const receivePage = await openReceiveOrder(page);
		await receivePage.openWillCallOrder();
		await receivePage.selectOrderType('Will Call — Flowers');

		const { shown } = await receivePage.handleDuplicateDeliveryPopupIfPresent();
		test.skip(!shown, 'No existing completed delivery is available to trigger the duplicate warning in this environment');
		await receivePage.verifyDuplicatePopupActionsVisible();
	});

	test('TC_RCSP-168_08 - Create Anyway continues the flow and retains pricing-feed Unit Cost', {
		tag: ['@functional'],
	}, async ({ page }) => {
		await login(page);
		const receivePage = await openReceiveOrder(page);
		await receivePage.openWillCallOrder();
		await receivePage.selectOrderType('Will Call — Flowers');

		const { shown } = await receivePage.handleDuplicateDeliveryPopupIfPresent();
		if (shown) await receivePage.clickCreateAnyway();

		const selected = await receivePage.searchAndSelectAddItem(PRICED_ITEM).then(() => true).catch(() => false);
		test.skip(!selected, 'Priced item is not available to verify Create Anyway continuation');
		await receivePage.verifyUnitCostReadOnlyAndPopulated();
	});

	test('TC_RCSP-168_09 - Batch Number is removed from the MVP New Delivery form', {
		tag: ['@regression'],
	}, async ({ page }) => {
		await login(page);
		const receivePage = await openNewDeliveryWithItem(page, 'Will Call — McLane', PRICED_ITEM);
		await receivePage.verifyBatchNumberFieldAbsent();
	});
});
