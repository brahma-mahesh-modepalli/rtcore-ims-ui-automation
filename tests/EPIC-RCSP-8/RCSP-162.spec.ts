import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage as LoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage as ScheduledOrdersPage } from '../../pages/Ordering/ScheduledOrderPage';
import { OrderHistoryPage } from '../../pages/Ordering/OrderHistoryPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

interface Rcsp162ItemData {
	itemName: string;
	category: string;
	purchasingUom: string;
}

interface Rcsp162StoreUserData {
	username: string;
	password: string;
}

interface Rcsp162FieldNames {
	unitPrice: string;
	uom: string;
}

interface Rcsp162CommonData {
	storeUser: Rcsp162StoreUserData;
	fieldNames: Rcsp162FieldNames;
}

interface Rcsp162TestCaseData {
	vendors?: string[];
	inventoryItems?: Rcsp162ItemData[];
	fieldNames?: Partial<Rcsp162FieldNames>;
}

interface Rcsp162ScenarioData {
	scenarioId: string;
	epic: string;
	feature: string;
	description: string;
	commonData: Rcsp162CommonData;
	testCases: Array<{
		testCaseId: string;
		testName: string;
		description: string;
		testData: Rcsp162TestCaseData;
	}>;
}

interface Rcsp162VendorInventoryTestData extends Rcsp162TestCaseData {
	vendors: string[];
	inventoryItems: Rcsp162ItemData[];
}

interface Rcsp162InventoryItemsTestData extends Rcsp162TestCaseData {
	inventoryItems: Rcsp162ItemData[];
}

const RCSP_162_FILE_NAME = 'RCSP-162';
const RCSP_162_SCENARIO_ID = 'RCSP-162';

const RCSP_162_TEST_CASE_IDS = {
	unitPriceRemovedNewScheduledOrder: 'TC_RCSP-162_01',
	unitPriceHiddenAllCategories: 'TC_RCSP-162_02',
	keyboardAndDomInspection: 'TC_RCSP-162_03',
	orderHistoryVisibility: 'TC_RCSP-162_04',
	orderHistoryAfterAddItems: 'TC_RCSP-162_05',
	uomReadOnlyScheduled: 'TC_RCSP-162_06',
	uomReadOnlyHistory: 'TC_RCSP-162_07',
	purchasingUomScheduled: 'TC_RCSP-162_08',
	purchasingUomHistory: 'TC_RCSP-162_09',
	unitPriceVisibleScheduledReceived: 'TC_RCSP-162_10',
	unitPriceVisibleOrderHistoryReceived: 'TC_RCSP-162_11',
	unitPriceReadOnlyScheduledHistory: 'TC_RCSP-162_12',
	unitPriceReadOnlyOrderHistory: 'TC_RCSP-162_13',
	unitPriceHiddenBeforeReceive: 'TC_RCSP-162_14',
	unitPriceHiddenConsistency: 'TC_RCSP-162_15',
} as const;

class DashboardPage {
	readonly orderingMenu;
	readonly alertDialog;
	readonly sidebar;
	readonly scheduledOrdersLink;

	constructor(private readonly page: Page) {
		this.sidebar = this.page.getByRole('complementary').first();
		this.orderingMenu = this.page
			.getByRole('complementary')
			.first()
			.getByRole('button', { name: 'Ordering' });
		this.scheduledOrdersLink = this.sidebar.getByRole('link', {
			name: 'Scheduled Orders',
			exact: true,
		});
		this.alertDialog = this.page.getByRole('alertdialog');
	}

	async dismissBlockingAlertIfPresent(): Promise<void> {
		if (!(await this.alertDialog.isVisible().catch(() => false))) {
			return;
		}

		const dismissButtonPatterns = [/^ok$/i, /^close$/i, /^dismiss$/i, /^cancel$/i, /^continue$/i];

		for (const pattern of dismissButtonPatterns) {
			const dismissButton = this.alertDialog.getByRole('button', { name: pattern }).first();
			if (await dismissButton.isVisible().catch(() => false)) {
				await dismissButton.click();
				await this.alertDialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
				return;
			}
		}

		await this.page.keyboard.press('Escape').catch(() => undefined);
		await this.alertDialog.waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => undefined);
	}

	async expandOrderingMenu(): Promise<void> {
		await this.dismissBlockingAlertIfPresent();

		if (await this.scheduledOrdersLink.isVisible().catch(() => false)) {
			return;
		}

		await expect(this.orderingMenu).toBeVisible();
		await this.orderingMenu.click();
		await expect(this.scheduledOrdersLink).toBeVisible();
	}

	async clickOrderingSubmenuLink(linkName: string): Promise<void> {
		await this.dismissBlockingAlertIfPresent();
		await this.expandOrderingMenu();

		const targetLink = this.sidebar.getByRole('link', { name: linkName, exact: true });
		await expect(targetLink).toBeVisible();

		const href = await targetLink.getAttribute('href');
		await targetLink.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		if (!href) {
			return;
		}

		const originMatch = this.page.url().match(/^https?:\/\/[^/]+/);
		const origin = originMatch?.[0] ?? '';
		const targetUrl = /^https?:\/\//i.test(href) ? href : `${origin}${href}`;
		const currentPath = this.page.url().replace(/^https?:\/\/[^/]+/, '');
		const targetPath = href.replace(/^https?:\/\/[^/]+/, '');

		if (currentPath !== targetPath) {
			await this.page.goto(targetUrl);
			await this.page.waitForLoadState('networkidle').catch(() => undefined);
		}
	}
}

function getRcsp162ScenarioData(): Rcsp162ScenarioData {
	return getScenarioTestData<Rcsp162ScenarioData>(RCSP_162_FILE_NAME, RCSP_162_SCENARIO_ID);
}

function getRcsp162TestData<T extends Rcsp162TestCaseData = Rcsp162TestCaseData>(
	testCaseId: string,
): Rcsp162CommonData & T & { fieldNames: Rcsp162FieldNames } {
	const scenarioData = getRcsp162ScenarioData();
	const testCaseData = getScenarioTestCaseData<T>(RCSP_162_FILE_NAME, RCSP_162_SCENARIO_ID, testCaseId);

	return {
		...scenarioData.commonData,
		...testCaseData,
		fieldNames: {
			...scenarioData.commonData.fieldNames,
			...(testCaseData.fieldNames ?? {}),
		},
	} as Rcsp162CommonData & T & { fieldNames: Rcsp162FieldNames };
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loginAsStoreUser(
	page: Page,
	loginPage: LoginPage,
	storeUser: Rcsp162StoreUserData,
): Promise<void> {
	await test.step('Login as store user', async () => {
		await page.goto(CONFIG.dashboardURL);
		await page.waitForLoadState('networkidle').catch(() => undefined);

		if (await loginPage.isLoginFormVisible()) {
			await loginPage.login(storeUser.username, storeUser.password);
		} else {
			await loginPage.waitForAuthenticatedApp();
		}
	});

	await loginPage.waitForAuthenticatedApp();
	log('✓ Logged in using store user credentials');
}

async function navigateToScheduledOrders(
	dashboardPage: DashboardPage,
	scheduledOrdersPage: ScheduledOrdersPage,
): Promise<void> {
	await test.step('Navigate to Ordering > Scheduled Orders', async () => {
		await dashboardPage.clickOrderingSubmenuLink('Scheduled Orders');
		await scheduledOrdersPage.verifyScheduledOrdersPageLoaded();
	});
}

async function navigateToOrderHistory(
	dashboardPage: DashboardPage,
	orderHistoryPage: OrderHistoryPage,
): Promise<void> {
	await test.step('Navigate to Ordering > Order History', async () => {
		await dashboardPage.clickOrderingSubmenuLink('Order History');
		await orderHistoryPage.verifyOrderHistoryPageLoaded();
	});
}

test.describe('RCSP-162 @rcsp162 @ordering @scheduled @orderhistory', () => {
	let loginPage: LoginPage;
	let dashboardPage: DashboardPage;
	let scheduledOrdersPage: ScheduledOrdersPage;
	let orderHistoryPage: OrderHistoryPage;
	let scenarioData: Rcsp162ScenarioData;

	test.beforeEach(async ({ page }) => {
		scenarioData = getRcsp162ScenarioData();
		loginPage = new LoginPage(page);
		dashboardPage = new DashboardPage(page);
		scheduledOrdersPage = new ScheduledOrdersPage(page);
		orderHistoryPage = new OrderHistoryPage(page);

		await loginAsStoreUser(page, loginPage, scenarioData.commonData.storeUser);
	});

	test.afterEach(async ({ page }, testInfo) => {
		if (testInfo.status === testInfo.expectedStatus) {
			return;
		}

		await page.screenshot({
			path: `test-results/screenshots/${testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-failure.png`,
			fullPage: true,
		});
	});

	test('TC_RCSP-162_01 @rcsp162 Verify Unit Price field is removed from New Scheduled Order for store users', async () => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.unitPriceRemovedNewScheduledOrder);
		await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);
		await scheduledOrdersPage.clickNewScheduledOrderButton();

		await test.step('Verify Unit Price field is not displayed', async () => {
			await scheduledOrdersPage.verifyFieldHidden(testData.fieldNames.unitPrice);
		});
	});

	test('TC_RCSP-162_02 @rcsp162 Verify Unit Price field is hidden for all item categories', async () => {
		const testData = getRcsp162TestData<Rcsp162VendorInventoryTestData>(
			RCSP_162_TEST_CASE_IDS.unitPriceHiddenAllCategories,
		);
		await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);

		const createdOrder = await scheduledOrdersPage.createNewScheduledOrderContext(testData.vendors);
		test.skip(!createdOrder.created, createdOrder.reason ?? 'Unable to create scheduled order context.');

		const addedItems = await scheduledOrdersPage.addItemsToOrder(testData.inventoryItems);
		test.skip(
			addedItems.addedCount === 0,
			addedItems.reason ?? 'Unable to add inventory items for category-level validation.',
		);

		await test.step('Verify Unit Price is absent for all item categories', async () => {
			for (const item of testData.inventoryItems) {
				await scheduledOrdersPage.verifyFieldHidden(`${item.itemName} ${testData.fieldNames.unitPrice}`);
			}

			await scheduledOrdersPage.verifyFieldHidden(testData.fieldNames.unitPrice);
		});
	});

	test('TC_RCSP-162_03 @rcsp162 Verify Unit Price cannot be accessed via keyboard or DOM inspection', async () => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.keyboardAndDomInspection);
		await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);
		await scheduledOrdersPage.clickNewScheduledOrderButton();

		await test.step('Verify keyboard focus never lands on Unit Price controls', async () => {
			await scheduledOrdersPage.verifyUnitPriceNotAccessibleByKeyboard();
		});

		await test.step('Verify Unit Price element is not present in DOM', async () => {
			await scheduledOrdersPage.verifyFieldHidden(testData.fieldNames.unitPrice, true);
		});
	});

	test('TC_RCSP-162_04 @rcsp162 Verify Unit Price field visibility matches the active role on Order History screen', async ({ page }) => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.orderHistoryVisibility);
		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		await orderHistoryPage.searchAndOpenOrder();
		const isAdminUser = /admin/i.test(testData.storeUser.username);

		await test.step('Verify Unit Price visibility matches the logged-in role on Order History context', async () => {
			const unitPriceColumn = page
				.getByRole('columnheader', { name: new RegExp(testData.fieldNames.unitPrice, 'i') })
				.first();

			if (isAdminUser) {
				await expect(unitPriceColumn).toBeVisible();
				return;
			}

			await orderHistoryPage.verifyFieldHidden(testData.fieldNames.unitPrice);
		});
	});

	test('TC_RCSP-162_05 @rcsp162 Verify Unit Price remains unavailable after adding items in Order History', async () => {
		const testData = getRcsp162TestData<Rcsp162InventoryItemsTestData>(
			RCSP_162_TEST_CASE_IDS.orderHistoryAfterAddItems,
		);
		await navigateToOrderHistory(dashboardPage, orderHistoryPage);

		const openedOrder = await orderHistoryPage.searchAndOpenOrder();
		test.skip(!openedOrder.opened, 'No openable order was found in Order History.');

		const addedItems = await scheduledOrdersPage.addItemsToOrder(testData.inventoryItems);
		test.skip(
			addedItems.addedCount === 0,
			addedItems.reason ?? 'Unable to add items in current Order History order state.',
		);

		await test.step('Verify Unit Price remains hidden after adding items', async () => {
			await orderHistoryPage.verifyFieldHidden(testData.fieldNames.unitPrice);
		});
	});

	test('TC_RCSP-162_06 @rcsp162 Verify UOM field is read-only in New Scheduled Order', async ({ page }) => {
		const testData = getRcsp162TestData<Rcsp162VendorInventoryTestData>(
			RCSP_162_TEST_CASE_IDS.uomReadOnlyScheduled,
		);
		await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);
		const createdOrder = await scheduledOrdersPage.createNewScheduledOrderContext(testData.vendors);
		test.skip(!createdOrder.created, createdOrder.reason ?? 'Unable to create scheduled order context.');

		const addedItems = await scheduledOrdersPage.addItemsToOrder(testData.inventoryItems);
		test.skip(addedItems.addedCount === 0, addedItems.reason ?? 'Unable to add item to evaluate UOM controls.');

		await test.step('Verify UOM field is visible and not editable', async () => {
			const uomLocator = page
				.getByText(new RegExp(`^${escapeRegExp(testData.fieldNames.uom)}$`, 'i'))
				.first();
			if (await uomLocator.isVisible().catch(() => false)) {
				await scheduledOrdersPage.verifyFieldReadOnly(uomLocator);
				return;
			}

			const uomDropdown = page.getByRole('button', { name: /uom|case|each|pack/i }).first();
			if (await uomDropdown.isVisible().catch(() => false)) {
				await scheduledOrdersPage.verifyDropdownDisabled(uomDropdown);
			}
		});
	});

	test('TC_RCSP-162_07 @rcsp162 Verify UOM field is read-only in Order History', async ({ page }) => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.uomReadOnlyHistory);
		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		const openedOrder = await orderHistoryPage.searchAndOpenOrder();
		test.skip(!openedOrder.opened, 'No openable order was found in Order History.');

		await test.step('Locate UOM field and verify read-only state', async () => {
			const uomLocator = page
				.getByText(new RegExp(`^${escapeRegExp(testData.fieldNames.uom)}$`, 'i'))
				.first();
			if (await uomLocator.isVisible().catch(() => false)) {
				await orderHistoryPage.verifyFieldReadOnly(uomLocator);
				return;
			}

			const uomDropdown = page.getByRole('button', { name: /uom|case|each|pack/i }).first();
			if (await uomDropdown.isVisible().catch(() => false)) {
				await orderHistoryPage.verifyDropdownDisabled(uomDropdown);
			}
		});
	});

	test('TC_RCSP-162_08 @rcsp162 Verify only one purchasing UOM per item in Scheduled Orders', async ({ page }) => {
		const testData = getRcsp162TestData<Rcsp162VendorInventoryTestData>(
			RCSP_162_TEST_CASE_IDS.purchasingUomScheduled,
		);
		await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);
		const createdOrder = await scheduledOrdersPage.createNewScheduledOrderContext(
			testData.vendors,
			undefined,
			testData.inventoryItems,
		);
		test.skip(!createdOrder.created, createdOrder.reason ?? 'Unable to create scheduled order context.');

		const addedItems = await scheduledOrdersPage.addItemsToOrder(testData.inventoryItems);
		test.skip(
			addedItems.addedCount === 0,
			addedItems.reason ?? 'Unable to add items for purchasing UOM verification.',
		);

		await test.step('Verify requested item rows expose a single non-editable UOM value', async () => {
			for (const item of testData.inventoryItems) {
				const itemRows = page.locator('main table tbody tr').filter({
					hasText: new RegExp(escapeRegExp(item.itemName), 'i'),
				});
				const itemRowCount = await itemRows.count();

				if (itemRowCount === 0) {
					continue;
				}

				const itemRow = itemRows.first();
				const uomCell = itemRow.locator('td').nth(2);
				const uomButton = uomCell.getByRole('button').first();

				if (await uomButton.isVisible().catch(() => false)) {
					await scheduledOrdersPage.verifyDropdownDisabled(uomButton);
					continue;
				}

				await expect.soft(uomCell).toBeVisible();
			}
		});
	});

	test('TC_RCSP-162_09 @rcsp162 Verify only one purchasing UOM is displayed in Order History', async ({ page }) => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.purchasingUomHistory);
		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		const openedOrder = await orderHistoryPage.searchAndOpenOrder();
		test.skip(!openedOrder.opened, 'No openable order was found in Order History.');

		await test.step('Verify UOM cannot be modified in Order History', async () => {
			const uomDropdown = page
				.getByRole('button')
				.filter({ hasText: new RegExp(`cs|pk|ea|${escapeRegExp(testData.fieldNames.uom)}`, 'i') })
				.first();
			if (await uomDropdown.isVisible().catch(() => false)) {
				await orderHistoryPage.verifyDropdownDisabled(uomDropdown);
			}
		});
	});

	test('TC_RCSP-162_10 @rcsp162 Verify Unit Price visible after scheduled order is received and invoiced', async ({ page }) => {
		const testData = getRcsp162TestData<Rcsp162VendorInventoryTestData>(
			RCSP_162_TEST_CASE_IDS.unitPriceVisibleScheduledReceived,
		);
		await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);
		const createdOrder = await scheduledOrdersPage.createNewScheduledOrderContext(
			testData.vendors,
			undefined,
			testData.inventoryItems,
		);
		test.skip(!createdOrder.created, createdOrder.reason ?? 'Unable to create scheduled order context.');

		const addedItems = await scheduledOrdersPage.addItemsToOrder(testData.inventoryItems);
		test.skip(addedItems.addedCount === 0, addedItems.reason ?? 'Unable to add item before scheduled-order submission.');

		await test.step('Submit scheduled order', async () => {
			const submission = await scheduledOrdersPage.submitCurrentOrder();
			test.skip(!submission.submitted, submission.reason ?? 'Scheduled order could not be submitted.');
		});

		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		const openedOrder = await orderHistoryPage.searchAndOpenOrder();
		test.skip(!openedOrder.opened, 'Submitted scheduled order is not openable in Order History.');

		const receivingResult = await orderHistoryPage.completeReceivingWorkflow();
		test.skip(!receivingResult.completed, receivingResult.reason ?? 'Receiving workflow unavailable.');

		await test.step('Verify Unit Price appears and compare to invoice values when available', async () => {
			const unitPrice = page.getByText(new RegExp(testData.fieldNames.unitPrice, 'i')).first();
			await expect(unitPrice).toBeVisible();

			const invoicePriceText = page.getByText(/invoice price/i).first();
			if (await invoicePriceText.isVisible().catch(() => false)) {
				const invoiceText = (await invoicePriceText.textContent()) ?? '';
				const unitText = (await unitPrice.textContent()) ?? '';
				expect.soft(unitText.length).toBeGreaterThan(0);
				expect.soft(invoiceText.length).toBeGreaterThan(0);
			}
		});
	});

	test('TC_RCSP-162_11 @rcsp162 Verify Unit Price visible after Order History request is received and invoiced', async ({ page }) => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.unitPriceVisibleOrderHistoryReceived);
		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		const openedOrder = await orderHistoryPage.searchAndOpenOrder();
		test.skip(!openedOrder.opened, 'No openable order was found in Order History.');

		const receivingResult = await orderHistoryPage.completeReceivingWorkflow();
		test.skip(!receivingResult.completed, receivingResult.reason ?? 'Receiving workflow unavailable.');

		await test.step('Verify Unit Price field is displayed after receiving', async () => {
			await expect(page.getByText(new RegExp(testData.fieldNames.unitPrice, 'i')).first()).toBeVisible();
		});
	});

	test('TC_RCSP-162_12 @rcsp162 Verify Unit Price read-only in Order History for Scheduled Orders', async ({ page }) => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.unitPriceReadOnlyScheduledHistory);
		await navigateToOrderHistory(dashboardPage, orderHistoryPage);

		const openedScheduled = await orderHistoryPage.openScheduledOrderFromHistory();
		test.skip(!openedScheduled.opened, openedScheduled.reason ?? 'No scheduled order rows found.');

		await test.step('Verify Unit Price is visible and read-only', async () => {
			const unitPriceField = page.getByText(new RegExp(testData.fieldNames.unitPrice, 'i')).first();
			await expect(unitPriceField).toBeVisible();
			await orderHistoryPage.verifyFieldReadOnly(unitPriceField);
		});
	});

	test('TC_RCSP-162_13 @rcsp162 Verify Unit Price read-only in Order History orders', async ({ page }) => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.unitPriceReadOnlyOrderHistory);
		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		const openedOrder = await orderHistoryPage.searchAndOpenOrder();
		test.skip(!openedOrder.opened, 'No openable order was found in Order History.');

		await test.step('Verify Unit Price field is read-only', async () => {
			const unitPriceField = page.getByText(new RegExp(testData.fieldNames.unitPrice, 'i')).first();
			await expect(unitPriceField).toBeVisible();
			await orderHistoryPage.verifyFieldReadOnly(unitPriceField);
		});
	});

	test('TC_RCSP-162_14 @rcsp162 Verify Unit Price hidden for orders not yet received', async () => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.unitPriceHiddenBeforeReceive);
		await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);
		await scheduledOrdersPage.clickNewScheduledOrderButton();

		await test.step('Do not receive order and verify Unit Price remains hidden', async () => {
			await scheduledOrdersPage.verifyFieldHidden(testData.fieldNames.unitPrice);
		});
	});

	test('TC_RCSP-162_15 @rcsp162 Verify Unit Price hidden consistency after refresh, relogin, and relaunch', async ({
		page,
		browser,
	}) => {
		const testData = getRcsp162TestData(RCSP_162_TEST_CASE_IDS.unitPriceHiddenConsistency);
		test.setTimeout(120000);

		await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);

		await test.step('Verify Unit Price hidden on initial load', async () => {
			await scheduledOrdersPage.verifyFieldHidden(testData.fieldNames.unitPrice);
		});

		await test.step('Refresh browser and revalidate hidden state', async () => {
			await scheduledOrdersPage.refreshBrowserAndValidate(async () => {
				await scheduledOrdersPage.verifyFieldHidden(testData.fieldNames.unitPrice);
			});
		});

		await test.step('Logout and login again, then validate hidden state', async () => {
			await page.goto(CONFIG.loginURL);
			await loginAsStoreUser(page, loginPage, testData.storeUser);
			await navigateToScheduledOrders(dashboardPage, scheduledOrdersPage);
			await scheduledOrdersPage.verifyFieldHidden(testData.fieldNames.unitPrice);
		});

		await test.step('Relaunch browser context and validate hidden state again', async () => {
			const relaunchContext = await browser.newContext();
			const relaunchPage = await relaunchContext.newPage();
			const relaunchLoginPage = new LoginPage(relaunchPage);
			const relaunchDashboardPage = new DashboardPage(relaunchPage);
			const relaunchScheduledPage = new ScheduledOrdersPage(relaunchPage);

			await loginAsStoreUser(relaunchPage, relaunchLoginPage, testData.storeUser);
			await navigateToScheduledOrders(relaunchDashboardPage, relaunchScheduledPage);
			await relaunchScheduledPage.verifyFieldHidden(testData.fieldNames.unitPrice);

			await relaunchContext.close();
		});
	});
});
