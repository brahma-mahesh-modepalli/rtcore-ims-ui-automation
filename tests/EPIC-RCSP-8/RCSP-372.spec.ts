import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-372';
const SCENARIO_ID = 'RCSP-372';

const TC = {
	draftCount: 'TC_RCSP-372-001',
	rollingSchedule: 'TC_RCSP-372-002',
	holidayExclusion: 'TC_RCSP-372-003',
	maintenanceExclusion: 'TC_RCSP-372-004',
	configurableCount: 'TC_RCSP-372-005',
} as const;

type CommonData = {
	hierarchy: { region: string; market: string; store: string };
	configuredDraftDays: number;
	holidayDate: string;
	maintenanceDate: string;
	alternateDraftDays: number | null;
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

test.describe('RCSP-372 - Configured future Draft Orders', () => {
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
		await scheduledOrderPage.verifyScheduledOrdersPageLoaded();
	});

	test('TC_RCSP-372-001 - Configured Draft Order count is displayed', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async () => {
		useCase(TC.draftCount);
		await scheduledOrderPage.verifyDraftOrderCount(getCommonData().configuredDraftDays);
	});

	test('TC_RCSP-372-002 - Rolling future Draft Order schedule is maintained', { tag: ['@functional'] }, async ({ page }) => {
		useCase(TC.rollingSchedule);
		const expected = getCommonData().configuredDraftDays;
		await scheduledOrderPage.verifyDraftDatesUniqueAndFuture(expected);
		await page.reload();
		await scheduledOrderPage.verifyDraftDatesUniqueAndFuture(expected);
	});

	test('TC_RCSP-372-003 - Configured holidays are excluded from Draft dates', { tag: ['@regression'] }, async () => {
		useCase(TC.holidayExclusion);
		const common = getCommonData();
		test.skip(!common.holidayDate, 'Set commonData.holidayDate to the configured WB Unit 1034 holiday');
		await scheduledOrderPage.verifyDraftDateExcluded(common.holidayDate, common.configuredDraftDays);
	});

	test('TC_RCSP-372-004 - Maintenance dates are excluded from Draft dates', { tag: ['@regression'] }, async () => {
		useCase(TC.maintenanceExclusion);
		const common = getCommonData();
		test.skip(!common.maintenanceDate, 'Set commonData.maintenanceDate to a configured WB Unit 1034 maintenance date');
		await scheduledOrderPage.verifyDraftDateExcluded(common.maintenanceDate, common.configuredDraftDays);
	});

	test('TC_RCSP-372-005 - Draft Order count follows configured value', { tag: ['@functional'] }, async () => {
		useCase(TC.configurableCount);
		const common = getCommonData();
		await scheduledOrderPage.verifyDraftOrderCount(common.configuredDraftDays);
		test.skip(common.alternateDraftDays === null, 'No alternate Draft Order configuration is supplied');
		await scheduledOrderPage.verifyDraftOrderCount(common.alternateDraftDays!);
	});
});
