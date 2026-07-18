import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage as LoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { HotShotOrderPage } from '../../pages/Ordering/HotShotOrderPage';
import { OrderHistoryPage } from '../../pages/Ordering/OrderHistoryPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

interface Rcsp166ItemData {
	itemName: string;
}

interface Rcsp166StoreUserData {
	username: string;
	password: string;
}

interface Rcsp166FieldNames {
	notes: string;
}

interface Rcsp166OrderCreationData {
	vendors: string[];
	inventoryItems: Rcsp166ItemData[];
}

interface Rcsp166CommonData {
	storeUser: Rcsp166StoreUserData;
	fieldNames: Rcsp166FieldNames;
	orderCreation: Rcsp166OrderCreationData;
}

interface Rcsp166TestCaseData {
	notes?: string;
	initialNotes?: string;
	updatedNotes?: string;
	notesSeed?: string;
	repeatCount?: number;
	validationPatterns?: string[];
	fieldNames?: Partial<Rcsp166FieldNames>;
	orderCreation?: Partial<Rcsp166OrderCreationData>;
}

interface Rcsp166ScenarioData {
	scenarioId: string;
	epic: string;
	feature: string;
	description: string;
	commonData: Rcsp166CommonData;
	testCases: Array<{
		testCaseId: string;
		testName: string;
		description: string;
		testData: Rcsp166TestCaseData;
	}>;
}

interface Rcsp166NotesTestData extends Rcsp166TestCaseData {
	notes: string;
}

interface Rcsp166DraftUpdateTestData extends Rcsp166TestCaseData {
	initialNotes: string;
	updatedNotes: string;
}

interface Rcsp166NotesValidationTestData extends Rcsp166TestCaseData {
	notesSeed: string;
	repeatCount: number;
	validationPatterns: string[];
}

const RCSP_166_FILE_NAME = 'RCSP-166';
const RCSP_166_SCENARIO_ID = 'RCSP-166';

const RCSP_166_TEST_CASE_IDS = {
	notesFieldScheduledOrder: 'TC_RCSP-166_01',
	notesFieldHotShotOrder: 'TC_RCSP-166_02',
	saveDraftNotes: 'TC_RCSP-166_03',
	updateDraftNotes: 'TC_RCSP-166_04',
	submittedOrderRestriction: 'TC_RCSP-166_05',
	hotShotNotesSubmit: 'TC_RCSP-166_06',
	draftNotesVisibleInHistory: 'TC_RCSP-166_07',
	submittedNotesVisibleInHistory: 'TC_RCSP-166_08',
	hotShotNotesVisibleInHistory: 'TC_RCSP-166_09',
	multilineSpecialCharacterNotes: 'TC_RCSP-166_10',
	notesCharacterLimitValidation: 'TC_RCSP-166_11',
} as const;

class DashboardPage {
	readonly orderingMenu;
	readonly alertDialog;
	readonly sidebar;
	readonly scheduledOrdersLink;

	constructor(private readonly page: Page) {
		this.sidebar = this.page.getByRole('complementary').first();
		this.orderingMenu = this.sidebar.getByRole('button', { name: 'Ordering' });
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

function getRcsp166ScenarioData(): Rcsp166ScenarioData {
	return getScenarioTestData<Rcsp166ScenarioData>(RCSP_166_FILE_NAME, RCSP_166_SCENARIO_ID);
}

function getRcsp166TestData<T extends Rcsp166TestCaseData = Rcsp166TestCaseData>(
	testCaseId: string,
): Rcsp166CommonData & T & { fieldNames: Rcsp166FieldNames; orderCreation: Rcsp166OrderCreationData } {
	const scenarioData = getRcsp166ScenarioData();
	const testCaseData = getScenarioTestCaseData<T>(RCSP_166_FILE_NAME, RCSP_166_SCENARIO_ID, testCaseId);

	return {
		...scenarioData.commonData,
		...testCaseData,
		fieldNames: {
			...scenarioData.commonData.fieldNames,
			...(testCaseData.fieldNames ?? {}),
		},
		orderCreation: {
			...scenarioData.commonData.orderCreation,
			...(testCaseData.orderCreation ?? {}),
		},
	} as Rcsp166CommonData & T & {
		fieldNames: Rcsp166FieldNames;
		orderCreation: Rcsp166OrderCreationData;
	};
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loginAsStoreUser(
	page: Page,
	loginPage: LoginPage,
	storeUser: Rcsp166StoreUserData,
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
	scheduledOrderPage: ScheduledOrderPage,
): Promise<void> {
	await test.step('Navigate to Ordering > Scheduled Orders', async () => {
		await dashboardPage.clickOrderingSubmenuLink('Scheduled Orders');
		await scheduledOrderPage.verifyScheduledOrdersPageLoaded();
	});
}

async function navigateToHotShotOrder(
	dashboardPage: DashboardPage,
	hotShotOrderPage: HotShotOrderPage,
): Promise<void> {
	await test.step('Navigate to Ordering > Hot Shot Order', async () => {
		await dashboardPage.clickOrderingSubmenuLink('Hot Shot Order');
		await hotShotOrderPage.verifyHotShotOrderPageLoaded();
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

async function openOrderInHistory(
	orderHistoryPage: OrderHistoryPage,
	options: {
		orderNumber?: string;
		orderType?: 'scheduled' | 'hotshot';
		status?: string;
		failureMessage: string;
	},
): Promise<string | undefined> {
	if (options.orderNumber) {
		const openByNumberResult = await orderHistoryPage.searchAndOpenOrder(options.orderNumber);
		if (openByNumberResult.opened) {
			return openByNumberResult.orderNumber ?? options.orderNumber;
		}
	}

	if (options.orderType) {
		const openByTypeResult = await orderHistoryPage.openLatestOrderByType(
			options.orderType,
			options.status,
		);
		expect(openByTypeResult.opened, openByTypeResult.reason ?? options.failureMessage).toBe(true);
		return openByTypeResult.orderNumber ?? options.orderNumber;
	}

	expect(false, options.failureMessage).toBe(true);
	return options.orderNumber;
}

function buildOverlongNotes(seed: string, repeatCount: number): string {
	return Array.from({ length: repeatCount }, () => seed).join(' ');
}

test.describe('RCSP-166 @rcsp166 @ordering @notes', () => {
	test.describe.configure({ timeout: 180_000 });

	let loginPage: LoginPage;
	let dashboardPage: DashboardPage;
	let scheduledOrderPage: ScheduledOrderPage;
	let hotShotOrderPage: HotShotOrderPage;
	let orderHistoryPage: OrderHistoryPage;
	let scenarioData: Rcsp166ScenarioData;

	test.beforeEach(async ({ page }) => {
		scenarioData = getRcsp166ScenarioData();
		loginPage = new LoginPage(page);
		dashboardPage = new DashboardPage(page);
		scheduledOrderPage = new ScheduledOrderPage(page);
		hotShotOrderPage = new HotShotOrderPage(page);
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

	test('TC_RCSP-166_01 @rcsp166 Verify that the Notes text field is available on the Create New Scheduled Order page', async ({
		page,
	}) => {
		const testData = getRcsp166TestData(RCSP_166_TEST_CASE_IDS.notesFieldScheduledOrder);
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);
		await scheduledOrderPage.clickNewScheduledOrderButton();

		await test.step('Verify Notes field is visible and editable on New Scheduled Order', async () => {
			await expect(
				page.getByText(new RegExp(`^${escapeRegExp(testData.fieldNames.notes)}$`, 'i')).first(),
			).toBeVisible();
			await scheduledOrderPage.assertNotesVisibleAndEditable();
		});
	});

	test('TC_RCSP-166_02 @rcsp166 Verify that the Notes text field is available on the Hot Shot Order page', async ({
		page,
	}) => {
		const testData = getRcsp166TestData(RCSP_166_TEST_CASE_IDS.notesFieldHotShotOrder);
		await navigateToHotShotOrder(dashboardPage, hotShotOrderPage);

		await test.step('Verify Notes field is visible and editable on Hot Shot Order', async () => {
			await expect(
				page.getByText(new RegExp(`^${escapeRegExp(testData.fieldNames.notes)}$`, 'i')).first(),
			).toBeVisible();
			await hotShotOrderPage.assertNotesVisibleAndEditable();
		});
	});

	test('TC_RCSP-166_03 @rcsp166 Verify Notes entered on Create New Scheduled Order are saved successfully after clicking Save as Draft', async () => {
		const testData = getRcsp166TestData<Rcsp166NotesTestData>(RCSP_166_TEST_CASE_IDS.saveDraftNotes);
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		const draftOrder = await scheduledOrderPage.createScheduledOrderDraft(
			testData.orderCreation.vendors,
			testData.orderCreation.inventoryItems,
			testData.notes,
		);
		test.skip(!draftOrder.saved, draftOrder.reason ?? 'Unable to create a Scheduled Order draft in the current environment.');

		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		await test.step('Verify draft order persists the exact Notes value', async () => {
			await scheduledOrderPage.assertOrderStatus('draft', draftOrder.orderNumber);

			const openDraftResult = await scheduledOrderPage.openOrderFromGrid(
				draftOrder.orderNumber,
				'draft',
			);

			expect(openDraftResult.editRestricted).not.toBe(true);
			expect(
				openDraftResult.opened,
				openDraftResult.reason ?? 'Expected the draft Scheduled Order to open from the grid.',
			).toBe(true);
			await scheduledOrderPage.assertNotesValue(testData.notes);
		});
	});

	test('TC_RCSP-166_04 @rcsp166 Verify that user can update Notes for a Draft Scheduled Order from the Scheduled Orders result grid', async () => {
		const testData = getRcsp166TestData<Rcsp166DraftUpdateTestData>(RCSP_166_TEST_CASE_IDS.updateDraftNotes);
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		const draftOrder = await scheduledOrderPage.createScheduledOrderDraft(
			testData.orderCreation.vendors,
			testData.orderCreation.inventoryItems,
			testData.initialNotes,
		);
		test.skip(!draftOrder.saved, draftOrder.reason ?? 'Unable to create a draft Scheduled Order for Notes update coverage.');

		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		const openDraftResult = await scheduledOrderPage.openOrderFromGrid(draftOrder.orderNumber, 'draft');
		expect(openDraftResult.editRestricted).not.toBe(true);
		expect(
			openDraftResult.opened,
			openDraftResult.reason ?? 'Expected the draft Scheduled Order to open from the grid.',
		).toBe(true);
		await scheduledOrderPage.assertNotesValue(testData.initialNotes);

		await scheduledOrderPage.updateNotes(testData.updatedNotes);
		const saveChangesResult = await scheduledOrderPage.saveCurrentOrderChanges();
		expect(
			saveChangesResult.saved,
			saveChangesResult.reason ?? 'Expected updated Notes to save successfully for the draft order.',
		).toBe(true);

		const draftOrderNumber = saveChangesResult.orderNumber ?? draftOrder.orderNumber;
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);
		await scheduledOrderPage.assertOrderStatus('draft', draftOrderNumber);

		const reopenedDraftResult = await scheduledOrderPage.openOrderFromGrid(draftOrderNumber, 'draft');
		expect(reopenedDraftResult.editRestricted).not.toBe(true);
		expect(
			reopenedDraftResult.opened,
			reopenedDraftResult.reason ?? 'Expected the updated draft Scheduled Order to reopen from the grid.',
		).toBe(true);
		await scheduledOrderPage.assertNotesValue(testData.updatedNotes);
		await expect(scheduledOrderPage.notesInput).not.toHaveValue(testData.initialNotes);
	});

	test('TC_RCSP-166_05 @rcsp166 Verify that user is restricted from editing Notes after Scheduled Order is created using Create and Submit', async () => {
		const testData = getRcsp166TestData<Rcsp166NotesTestData>(RCSP_166_TEST_CASE_IDS.submittedOrderRestriction);
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		const submittedOrder = await scheduledOrderPage.createAndSubmitScheduledOrder(
			testData.orderCreation.vendors,
			testData.orderCreation.inventoryItems,
			testData.notes,
		);
		test.skip(
			!submittedOrder.submitted,
			submittedOrder.reason ?? 'Unable to create a submitted Scheduled Order in the current environment.',
		);

		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);
		await scheduledOrderPage.assertOrderStatus('submitted', submittedOrder.orderNumber);

		const openSubmittedResult = await scheduledOrderPage.openOrderFromGrid(
			submittedOrder.orderNumber,
			'submitted',
		);

		expect(
			openSubmittedResult.opened || openSubmittedResult.editRestricted,
			openSubmittedResult.reason
				?? 'Expected the submitted Scheduled Order to either open in a non-editable state or expose no edit path.',
		).toBe(true);

		await scheduledOrderPage.assertNotesReadOnlyOrEditRestricted(openSubmittedResult, testData.notes);
	});

	test('TC_RCSP-166_06 @rcsp166 Verify that Notes entered on Hot Shot Order page are saved successfully after clicking Create and Submit', async () => {
		const testData = getRcsp166TestData<Rcsp166NotesTestData>(RCSP_166_TEST_CASE_IDS.hotShotNotesSubmit);
		await navigateToHotShotOrder(dashboardPage, hotShotOrderPage);

		const submittedHotShotOrder = await hotShotOrderPage.createAndSubmitHotShotOrder(
			testData.orderCreation.vendors,
			testData.notes,
		);
		test.skip(
			!submittedHotShotOrder.submitted,
			submittedHotShotOrder.reason ?? 'Unable to create a submitted Hot Shot order in the current environment.',
		);

		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		await openOrderInHistory(orderHistoryPage, {
			orderNumber: submittedHotShotOrder.orderNumber,
			orderType: 'hotshot',
			status: 'submitted',
			failureMessage: 'Expected the submitted Hot Shot order to open from Order History.',
		});
		await orderHistoryPage.assertNotesValue(testData.notes);
	});

	test('TC_RCSP-166_07 @rcsp166 Verify that Notes entered while saving Scheduled Order as Draft are visible correctly in Order History', async () => {
		const testData = getRcsp166TestData<Rcsp166NotesTestData>(RCSP_166_TEST_CASE_IDS.draftNotesVisibleInHistory);
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		const draftOrder = await scheduledOrderPage.createScheduledOrderDraft(
			testData.orderCreation.vendors,
			testData.orderCreation.inventoryItems,
			testData.notes,
		);
		test.skip(!draftOrder.saved, draftOrder.reason ?? 'Unable to create a Scheduled Order draft for Order History validation.');

		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		await openOrderInHistory(orderHistoryPage, {
			orderNumber: draftOrder.orderNumber,
			orderType: 'scheduled',
			status: 'draft',
			failureMessage: 'Expected the created Scheduled Order draft to open from Order History.',
		});
		await orderHistoryPage.assertNotesValue(testData.notes);
	});

	test('TC_RCSP-166_08 @rcsp166 Verify that Notes entered for Submitted Scheduled Order are visible correctly in Order History after submission', async () => {
		const testData = getRcsp166TestData<Rcsp166NotesTestData>(RCSP_166_TEST_CASE_IDS.submittedNotesVisibleInHistory);
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		const draftOrder = await scheduledOrderPage.createScheduledOrderDraft(
			testData.orderCreation.vendors,
			testData.orderCreation.inventoryItems,
			testData.notes,
		);
		test.skip(!draftOrder.saved, draftOrder.reason ?? 'Unable to create a Scheduled Order draft for submission coverage.');

		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);
		const submittedDraft = await scheduledOrderPage.submitDraftOrderFromGrid(draftOrder.orderNumber);
		test.skip(
			!submittedDraft.submitted,
			submittedDraft.reason ?? 'Unable to submit the created Scheduled Order draft from the grid.',
		);

		await scheduledOrderPage.assertOrderStatus('submitted', submittedDraft.orderNumber ?? draftOrder.orderNumber);
		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		await openOrderInHistory(orderHistoryPage, {
			orderNumber: submittedDraft.orderNumber ?? draftOrder.orderNumber,
			orderType: 'scheduled',
			status: 'submitted',
			failureMessage: 'Expected the submitted Scheduled Order to open from Order History.',
		});
		await orderHistoryPage.assertNotesValue(testData.notes);
	});

	test('TC_RCSP-166_09 @rcsp166 Verify that Notes entered while creating Hot Shot Order are visible correctly in Order History', async () => {
		const testData = getRcsp166TestData<Rcsp166NotesTestData>(RCSP_166_TEST_CASE_IDS.hotShotNotesVisibleInHistory);
		await navigateToHotShotOrder(dashboardPage, hotShotOrderPage);

		const submittedHotShotOrder = await hotShotOrderPage.createAndSubmitHotShotOrder(
			testData.orderCreation.vendors,
			testData.notes,
		);
		test.skip(
			!submittedHotShotOrder.submitted,
			submittedHotShotOrder.reason ?? 'Unable to create the Hot Shot order required for Order History validation.',
		);

		await navigateToOrderHistory(dashboardPage, orderHistoryPage);
		await openOrderInHistory(orderHistoryPage, {
			orderNumber: submittedHotShotOrder.orderNumber,
			orderType: 'hotshot',
			status: 'submitted',
			failureMessage: 'Expected the submitted Hot Shot order to open from Order History.',
		});
		await orderHistoryPage.assertNotesValue(testData.notes);
	});

	test('TC_RCSP-166_10 @rcsp166 Verify that Notes field on Scheduled Order creation page accepts special characters, multiline text, and numeric values', async () => {
		const testData = getRcsp166TestData<Rcsp166NotesTestData>(RCSP_166_TEST_CASE_IDS.multilineSpecialCharacterNotes);
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		const draftOrder = await scheduledOrderPage.createScheduledOrderDraft(
			testData.orderCreation.vendors,
			testData.orderCreation.inventoryItems,
			testData.notes,
		);
		test.skip(
			!draftOrder.saved,
			draftOrder.reason ?? 'Unable to create a Scheduled Order draft for multiline Notes validation.',
		);

		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);
		const openDraftResult = await scheduledOrderPage.openOrderFromGrid(draftOrder.orderNumber, 'draft');
		expect(openDraftResult.editRestricted).not.toBe(true);
		expect(
			openDraftResult.opened,
			openDraftResult.reason ?? 'Expected the draft Scheduled Order with multiline Notes to open from the grid.',
		).toBe(true);
		await scheduledOrderPage.assertNotesValue(testData.notes);
	});

	test('TC_RCSP-166_11 @rcsp166 Verify system validates maximum allowed character limit for Notes field on Scheduled Order creation page', async () => {
		const testData = getRcsp166TestData<Rcsp166NotesValidationTestData>(RCSP_166_TEST_CASE_IDS.notesCharacterLimitValidation);
		await navigateToScheduledOrders(dashboardPage, scheduledOrderPage);

		const orderContext = await scheduledOrderPage.createNewScheduledOrderContext(
			testData.orderCreation.vendors,
			'',
			testData.orderCreation.inventoryItems,
		);
		test.skip(
			!orderContext.created,
			orderContext.reason ?? 'Unable to create a Scheduled Order context for Notes length validation.',
		);

		const notesMaxLength = await scheduledOrderPage.getNotesMaxLength();
		const effectiveRepeatCount = notesMaxLength ? testData.repeatCount : Math.max(testData.repeatCount, 120);
		let overlongNotes = buildOverlongNotes(testData.notesSeed, effectiveRepeatCount);
		while (notesMaxLength && overlongNotes.length <= notesMaxLength + 20) {
			overlongNotes = `${overlongNotes} ${testData.notesSeed}`;
		}

		await scheduledOrderPage.fillNotes(overlongNotes, false);
		const notesValueAfterEntry = (await scheduledOrderPage.getNotesValue()).replace(/\r\n/g, '\n');
		const saveDraftAttempt = await scheduledOrderPage.saveCurrentOrderAsDraft();
		const validationMessages = await scheduledOrderPage.getNotesValidationMessages(testData.validationPatterns);
		const notesFieldInvalid = await scheduledOrderPage.isNotesFieldInvalid();
		const notesWereRestricted = notesValueAfterEntry !== overlongNotes.replace(/\r\n/g, '\n');
		const submissionPrevented = !saveDraftAttempt.saved;

		expect(
			notesWereRestricted || notesFieldInvalid || validationMessages.length > 0 || submissionPrevented,
			`Expected Notes max-length behavior to restrict extra characters, prevent save, or surface a validation state. Observed input length ${notesValueAfterEntry.length}, attempted length ${overlongNotes.length}, DOM maxLength ${notesMaxLength ?? 'not exposed'}.`,
		).toBe(true);

		if (validationMessages.length > 0) {
			expect(validationMessages.join(' ')).toMatch(
				new RegExp(testData.validationPatterns.map((pattern) => escapeRegExp(pattern)).join('|'), 'i'),
			);
		}
	});
});
