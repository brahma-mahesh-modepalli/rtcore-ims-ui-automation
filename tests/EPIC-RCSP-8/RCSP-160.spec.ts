import { test, expect, type Page, type Locator } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { HotShotOrderPage } from '../../pages/Ordering/HotShotOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-160';
const SCENARIO_ID = 'RCSP-160';

const TC = {
	newScheduledButton: 'TC_RCSP-160_001',
	newScheduledNavigation: 'TC_RCSP-160_002',
	hotShotVisible: 'TC_RCSP-160_003',
	hotShotOnlyAdHocPath: 'TC_RCSP-160_004',
} as const;

type CommonData = {
	hierarchy: { region: string; market: string; store: string };
};

class DashboardPage {
	readonly sidebar: Locator;
	readonly orderingMenu: Locator;
	readonly scheduledOrdersLink: Locator;
	readonly hotShotOrderLink: Locator;

	constructor(private readonly page: Page) {
		this.sidebar = page.getByRole('complementary').first();
		this.orderingMenu = this.sidebar.getByRole('button', { name: 'Ordering' });
		this.scheduledOrdersLink = this.sidebar.getByRole('link', { name: 'Scheduled Orders', exact: true });
		this.hotShotOrderLink = this.sidebar.getByRole('link', { name: 'Hot Shot Order', exact: true });
	}

	async expandOrdering(): Promise<void> {
		if (!(await this.scheduledOrdersLink.isVisible().catch(() => false))) {
			await this.orderingMenu.click();
		}
		await expect(this.scheduledOrdersLink).toBeVisible();
		await expect(this.hotShotOrderLink).toBeVisible();
	}

	async openScheduledOrders(): Promise<void> {
		await this.expandOrdering();
		await this.scheduledOrdersLink.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	async openHotShotOrder(): Promise<void> {
		await this.expandOrdering();
		await this.hotShotOrderLink.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	async verifyHotShotIsOnlyAdHocPath(): Promise<void> {
		await this.expandOrdering();
		await expect(this.hotShotOrderLink).toHaveCount(1);
		await expect(this.sidebar.getByRole('link', { name: /ad[- ]?hoc order/i })).toHaveCount(0);
		await expect(this.sidebar.getByRole('button', { name: /ad[- ]?hoc order/i })).toHaveCount(0);
	}
}

function getCommonData(): CommonData {
	return getScenarioTestData<{ commonData: CommonData }>(FILE_NAME, SCENARIO_ID).commonData;
}

function useCase(id: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, id);
}

test.describe('RCSP-160 - Scheduled and Hot Shot order paths', () => {
	test.setTimeout(90_000);
	let dashboardPage: DashboardPage;
	let scheduledOrderPage: ScheduledOrderPage;
	let hotShotOrderPage: HotShotOrderPage;

	test.beforeEach(async ({ page }) => {
		const common = getCommonData();
		const loginPage = new RTCDashboardLoginPage(page);
		const transfersPage = new TransfersPage(page);
		dashboardPage = new DashboardPage(page);
		scheduledOrderPage = new ScheduledOrderPage(page);
		hotShotOrderPage = new HotShotOrderPage(page);

		await page.goto(CONFIG.dashboardURL);
		await page.waitForLoadState('networkidle').catch(() => undefined);
		await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
		await transfersPage.switchStore(common.hierarchy.region, common.hierarchy.market, common.hierarchy.store);
	});

	test('TC_RCSP-160_001 - New Scheduled Order button is visible and enabled', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async () => {
		useCase(TC.newScheduledButton);
		await dashboardPage.openScheduledOrders();
		await scheduledOrderPage.verifyScheduledOrdersPageLoaded();
		await expect(scheduledOrderPage.newScheduledOrderButton).toBeVisible();
		await expect(scheduledOrderPage.newScheduledOrderButton).toBeEnabled();
	});

	test('TC_RCSP-160_002 - New Scheduled Order button opens creation page', { tag: ['@functional'] }, async () => {
		useCase(TC.newScheduledNavigation);
		await dashboardPage.openScheduledOrders();
		await scheduledOrderPage.clickNewScheduledOrderButton();
		await scheduledOrderPage.verifyNewScheduledOrderFormLoaded();
	});

	test('TC_RCSP-160_003 - Hot Shot Order is displayed and accessible', { tag: ['@functional'] }, async () => {
		useCase(TC.hotShotVisible);
		await dashboardPage.expandOrdering();
		await expect(dashboardPage.hotShotOrderLink).toBeVisible();
		await expect(dashboardPage.hotShotOrderLink).toBeEnabled();
		await dashboardPage.openHotShotOrder();
		await hotShotOrderPage.verifyHotShotOrderPageLoaded();
	});

	test('TC_RCSP-160_004 - Hot Shot Order is the only ad-hoc creation path', { tag: ['@regression'] }, async () => {
		useCase(TC.hotShotOnlyAdHocPath);
		await dashboardPage.verifyHotShotIsOnlyAdHocPath();
		await dashboardPage.openHotShotOrder();
		await hotShotOrderPage.verifyHotShotOrderPageLoaded();
	});
});
