import { test, expect } from '../../fixtures/baseTest';
import type { Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-146';
const SCENARIO_ID = 'RCSP-146';

const TC = {
	landingPageAndNavigation: 'TC_RCSP-146_01',
	newOrderFieldsAndControls: 'TC_RCSP-146_02',
} as const;

type CommonData = {
	hierarchy: { region: string; market: string; store: string };
	expectedVendors: string[];
	expectedRecommendation: string;
};

class OrderingNavigation {
	constructor(private readonly page: Page) {}

	async openScheduledOrders(): Promise<void> {
		const sidebar = this.page.getByRole('complementary').first();
		const orderingMenu = sidebar.getByRole('button', { name: /^Ordering$/i });
		const scheduledOrdersLink = sidebar.getByRole('link', { name: /^Scheduled Orders$/i });
		if (!(await scheduledOrdersLink.isVisible().catch(() => false))) {
			await orderingMenu.click();
		}
		await expect(scheduledOrdersLink).toBeVisible();
		await scheduledOrdersLink.click();
		await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
	}
}

function getCommonData(): CommonData {
	return getScenarioTestData<{ commonData: CommonData }>(FILE_NAME, SCENARIO_ID).commonData;
}

function useCase(id: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, id);
}

async function loginAndOpenScheduledOrders(page: Page, common: CommonData): Promise<ScheduledOrderPage> {
	const loginPage = new RTCDashboardLoginPage(page);
	await page.goto(CONFIG.dashboardURL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	await new TransfersPage(page).switchStore(
		common.hierarchy.region,
		common.hierarchy.market,
		common.hierarchy.store,
	);
	await new OrderingNavigation(page).openScheduledOrders();
	const scheduledOrderPage = new ScheduledOrderPage(page);
	await scheduledOrderPage.verifyScheduledOrdersPageLoaded();
	return scheduledOrderPage;
}

test.describe('RCSP-146 - Scheduled Orders page UI and navigation', () => {
	test.setTimeout(120_000);

	test('TC_RCSP-146_01 - Landing page UI and navigation to New Scheduled Order', async ({ page }) => {
		useCase(TC.landingPageAndNavigation);
		const common = getCommonData();
		const scheduledOrderPage = await loginAndOpenScheduledOrders(page, common);

		await expect(scheduledOrderPage.pageTitle).toHaveText('Scheduled Orders');
		await expect(scheduledOrderPage.pageDescription).toHaveText(
			'Purchase orders organized by upcoming delivery dates',
		);
		await expect(scheduledOrderPage.newScheduledOrderButton).toBeVisible();
		await expect(scheduledOrderPage.newScheduledOrderButton).toBeEnabled();
		await scheduledOrderPage.verifyStatusFiltersVisible();
		await scheduledOrderPage.verifyTableHeadersVisible();
		await expect(page.getByRole('columnheader', { name: /^Group$/i })).toBeVisible();

		await expect(page.getByText(/^Grouped by$/i)).toBeVisible();
		await expect(page.getByRole('button', { name: /Order Date/i })).toBeVisible();
		await expect(page.getByRole('alertdialog')).toHaveCount(0);

		await scheduledOrderPage.clickNewScheduledOrderButton();
		await scheduledOrderPage.verifyNewScheduledOrderFormLoaded();
		await expect(scheduledOrderPage.createOrderTitle).toHaveText('New Scheduled Order');
		await expect(page).toHaveURL(/\/orders\/scheduled\/new$/);
	});

	test('TC_RCSP-146_02 - New Scheduled Order fields and default controls', async ({ page }) => {
		useCase(TC.newOrderFieldsAndControls);
		const common = getCommonData();
		const scheduledOrderPage = await loginAndOpenScheduledOrders(page, common);
		await scheduledOrderPage.clickNewScheduledOrderButton();
		await scheduledOrderPage.verifyNewScheduledOrderFormLoaded();
		await scheduledOrderPage.verifyRequiredAndOptionalFields();
		await scheduledOrderPage.verifyLineItemColumns();

		await expect(scheduledOrderPage.createOrderTitle).toHaveText('New Scheduled Order');
		await expect(page.getByText('Create a purchase order with a required delivery date', { exact: true })).toBeVisible();
		await expect(scheduledOrderPage.vendorTriggerButton).toBeVisible();
		const vendorOptions = await scheduledOrderPage.getVendorOptions();
		expect(vendorOptions).toEqual(expect.arrayContaining(common.expectedVendors));

		await expect(page.getByText(/^AUTO-SUGGEST ITEMS$/i)).toBeVisible();
		await expect(page.getByText(common.expectedRecommendation, { exact: true })).toBeVisible();
		await scheduledOrderPage.assertNotesVisibleAndEditable();
		await expect(page.getByPlaceholder('Search items by name or description')).toBeVisible();
		await expect(page.getByRole('button', { name: /^No categories$/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /^Group$/i })).toBeVisible();
		await expect(scheduledOrderPage.addLineButton).toBeVisible();
		await expect(page.getByRole('button', { name: /New Lines/i })).toBeVisible();
		await expect(scheduledOrderPage.lineItemVendorDisabledButton).toBeDisabled();
		await expect(scheduledOrderPage.saveAsDraftButton).toBeVisible();
		await expect(scheduledOrderPage.createAndSubmitButton).toBeVisible();

		const mainWidth = await page.locator('main').evaluate((element) => {
			const box = element as unknown as { clientWidth: number; scrollWidth: number };
			return { clientWidth: box.clientWidth, scrollWidth: box.scrollWidth };
		});
		expect(mainWidth.scrollWidth).toBeLessThanOrEqual(mainWidth.clientWidth);
		await expect(page.getByRole('alertdialog')).toHaveCount(0);
		await expect(page).toHaveURL(/\/orders\/scheduled\/new$/);
	});
});
