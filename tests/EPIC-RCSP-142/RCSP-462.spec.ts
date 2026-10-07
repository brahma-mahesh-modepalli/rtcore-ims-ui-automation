import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { VendorSetupPage } from '../../pages/Inventory Setup/VendorSetupPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { getScenarioTestData } from '../../utils/testData';
import { Reporting } from '../../reporting/Reporting';

type StoreContext = {
	region: string;
	market: string;
	store: string;
	storeId: number;
	itemName: string;
};

type Rcsp462Data = {
	parentVendorName: string;
	mappedStore: StoreContext & { resolvedDcVendorCode: string };
	unmappedStore: StoreContext;
};

const SCENARIO_ID = 'RCSP-462';
const TEST_CASES = {
	childHierarchy: 'TC_RCSP-462_01',
	standaloneVendor: 'TC_RCSP-462_02',
	oneLevelHierarchy: 'TC_RCSP-462_03',
	createStandaloneVendor: 'TC_RCSP-462_04',
	createChildVendor: 'TC_RCSP-462_05',
	rejectInvalidVendor: 'TC_RCSP-462_06',
	cancelVendorEdit: 'TC_RCSP-462_07',
	hideMcLaneDcOptions: 'TC_RCSP-462_08',
	resolveMcLaneDcOnOrder: 'TC_RCSP-462_09',
	rejectOrderWithoutDcMapping: 'TC_RCSP-462_10',
} as const;

function getScenarioData(): Rcsp462Data {
	return getScenarioTestData<{ commonData: Rcsp462Data }>(
		SCENARIO_ID,
		SCENARIO_ID,
	).commonData;
}

function uniqueVendorCode(): string {
	return `QA462${Date.now().toString().slice(-7)}`;
}

async function queryWithResultLog<T>(label: string, query: Promise<T>): Promise<T> {
	const result = await query;
	Reporting.info(`[RCSP-462] ${label}: ${JSON.stringify(result)}`);
	return result;
}

async function login(page: import('@playwright/test').Page): Promise<void> {
	const loginPage = new RTCDashboardLoginPage(page);
	await page.goto(CONFIG.dashboardURL);
	await page.waitForLoadState('domcontentloaded').catch(() => undefined);
	await loginPage.login(
		CONFIG.credentials.admin.username,
		CONFIG.credentials.admin.password,
	);
}

async function openScheduledOrderForm(
	page: import('@playwright/test').Page,
	location: StoreContext,
): Promise<ScheduledOrderPage> {
	const transfersPage = new TransfersPage(page);
	await transfersPage.switchStore(location.region, location.market, location.store);

	const sidebar = page.getByRole('complementary').first();
	const orderingMenu = sidebar.getByRole('button', { name: /ordering/i }).first();
	const scheduledOrdersLink = sidebar
		.getByRole('link', { name: /scheduled orders/i })
		.first();
	if (!(await scheduledOrdersLink.isVisible().catch(() => false))) {
		await orderingMenu.click();
	}
	await expect(scheduledOrdersLink).toBeVisible();
	await scheduledOrdersLink.click();

	const scheduledOrderPage = new ScheduledOrderPage(page);
	await scheduledOrderPage.verifyScheduledOrdersPageLoaded();
	await scheduledOrderPage.clickNewScheduledOrderButton();
	await scheduledOrderPage.verifyNewScheduledOrderFormLoaded();
	return scheduledOrderPage;
}

async function requireStoreContext(
	context: StoreContext,
	description: string,
): Promise<void> {
	test.skip(
		!context.region || !context.market || !context.store || !context.storeId || !context.itemName,
		`Configure ${description} in test-data/RCSP-462.json`,
	);
}

async function requireStoreSelection(
	context: StoreContext,
	description: string,
): Promise<void> {
	test.skip(
		!context.region || !context.market || !context.store,
		`Configure ${description} in test-data/RCSP-462.json`,
	);
}

test.describe('RCSP-462 - Vendor parent-child hierarchy and McLane ordering', () => {
	test.setTimeout(180_000);

	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test(`${TEST_CASES.childHierarchy} - Child vendor hierarchy matches the database`, async ({
		page,
		testData,
	}) => {
		const children = await queryWithResultLog(
			`${TEST_CASES.childHierarchy} child vendors`,
			testData.getVendorsWithParent(),
		);
		test.skip(children.length === 0, 'No child vendors are configured in the database');
		const child = children[0];

		const vendorPage = new VendorSetupPage(page);
		await vendorPage.navigateToVendors();
		await vendorPage.verifyVendorHierarchy(child);
	});

	test(`${TEST_CASES.standaloneVendor} - Standalone vendors have no parent hierarchy`, async ({
		page,
		testData,
	}) => {
		const vendors = await queryWithResultLog(
			`${TEST_CASES.standaloneVendor} standalone vendors`,
			testData.getStandaloneVendors(),
		);
		test.skip(vendors.length === 0, 'No standalone vendors are configured in the database');

		const vendorPage = new VendorSetupPage(page);
		await vendorPage.navigateToVendors();
		await vendorPage.verifyStandaloneVendor(vendors[0]);
	});

	test(`${TEST_CASES.oneLevelHierarchy} - Child vendors cannot become parent vendors`, async ({
		page,
		testData,
	}) => {
		const children = await queryWithResultLog(
			`${TEST_CASES.oneLevelHierarchy} child vendors`,
			testData.getVendorsWithParent(),
		);
		test.skip(children.length === 0, 'No child vendors are configured in the database');
		const child = children[0];
		expect(child.parent_parent_vendor_id).toBeNull();
		if (!child.parent_code) throw new Error(`No parent code found for child vendor ${child.code}`);

		const vendorPage = new VendorSetupPage(page);
		await vendorPage.navigateToVendors();
		await vendorPage.openEditVendor(child.parent_code);
		await vendorPage.verifyParentVendorOptionExcluded(child.code, child.name);
	});

	test(`${TEST_CASES.createStandaloneVendor} - Required fields and standalone vendor creation`, async ({
		page,
		testData,
	}) => {
		const vendorPage = new VendorSetupPage(page);
		await vendorPage.navigateToVendors();
		await vendorPage.openNewVendor();
		await vendorPage.verifyNewVendorFields();

		await vendorPage.saveVendor();
		await vendorPage.verifyFormValidation();

		const code = uniqueVendorCode();
		const name = `RCSP-462 standalone ${code}`;
		await vendorPage.vendorCodeInput.fill(code);
		await vendorPage.saveVendor();
		await vendorPage.verifyFormValidation();

		await vendorPage.vendorNameInput.fill(name);
		await vendorPage.saveVendor();
		const created = await queryWithResultLog(
			`${TEST_CASES.createStandaloneVendor} created vendor`,
			testData.getVendorByCode(code),
		);
		expect(created?.name).toBe(name);
		expect(created?.parent_vendor_id).toBeNull();
	});

	test(`${TEST_CASES.createChildVendor} - Child vendor saves the selected parent mapping`, async ({
		page,
		testData,
	}) => {
		const parents = await queryWithResultLog(
			`${TEST_CASES.createChildVendor} candidate parents`,
			testData.getStandaloneVendors(),
		);
		test.skip(parents.length === 0, 'No top-level parent vendor is available');
		const parent = parents[0];
		const code = uniqueVendorCode();
		const name = `RCSP-462 child ${code}`;

		const vendorPage = new VendorSetupPage(page);
		await vendorPage.navigateToVendors();
		await vendorPage.openNewVendor();
		await vendorPage.vendorCodeInput.fill(code);
		await vendorPage.vendorNameInput.fill(name);
		await vendorPage.selectParentVendor(parent.name);
		await vendorPage.saveVendor();

		const created = await queryWithResultLog(
			`${TEST_CASES.createChildVendor} created vendor`,
			testData.getVendorByCode(code),
		);
		expect(created?.name).toBe(name);
		expect(created?.parent_vendor_id).toBe(parent.id);
	});

	test(`${TEST_CASES.rejectInvalidVendor} - Duplicate and whitespace vendor values are rejected`, async ({
		page,
		testData,
	}) => {
		const existing = await queryWithResultLog(
			`${TEST_CASES.rejectInvalidVendor} existing vendor`,
			testData.getAnyVendor(),
		);
		test.skip(!existing, 'No existing vendor is available for duplicate validation');

		const vendorPage = new VendorSetupPage(page);
		await vendorPage.navigateToVendors();
		await vendorPage.openNewVendor();
		await vendorPage.vendorCodeInput.fill(existing!.code);
		await vendorPage.vendorNameInput.fill(`Duplicate ${uniqueVendorCode()}`);
		await vendorPage.saveVendor();
		await vendorPage.verifyDuplicateValidation();

		await vendorPage.vendorCodeInput.fill('   ');
		await vendorPage.vendorNameInput.fill('   ');
		await vendorPage.saveVendor();
		await vendorPage.verifyFormValidation();
	});

	test(`${TEST_CASES.cancelVendorEdit} - Cancel discards vendor edits`, async ({
		page,
		testData,
	}) => {
		const original = await queryWithResultLog(
			`${TEST_CASES.cancelVendorEdit} original vendor`,
			testData.getAnyVendor(),
		);
		test.skip(!original, 'No vendor is available for edit validation');

		const vendorPage = new VendorSetupPage(page);
		await vendorPage.navigateToVendors();
		await vendorPage.openEditVendor(original!.code);
		await vendorPage.verifyEditVendorValues(original!);
		await vendorPage.vendorNameInput.fill(`${original!.name} changed`);
		await vendorPage.cancelVendorEdit();

		const persisted = await queryWithResultLog(
			`${TEST_CASES.cancelVendorEdit} persisted vendor`,
			testData.getVendorByCode(original!.code),
		);
		expect(persisted?.name).toBe(original!.name);
		expect(persisted?.parent_vendor_id).toBe(original!.parent_vendor_id);
	});

	test(`${TEST_CASES.hideMcLaneDcOptions} - Ordering displays McLane once and hides its DC vendors`, async ({
		page,
		testData,
	}) => {
		const scenario = getScenarioData();
		await requireStoreSelection(scenario.mappedStore, 'the McLane-mapped store');
		const hierarchy = await queryWithResultLog(
			`${TEST_CASES.hideMcLaneDcOptions} McLane hierarchy`,
			testData.getMcLaneVendorHierarchy(scenario.parentVendorName),
		);
		test.skip(!hierarchy, `No ${scenario.parentVendorName} parent/child hierarchy is configured`);
		expect(hierarchy!.children).toHaveLength(6);

		const orderPage = await openScheduledOrderForm(page, scenario.mappedStore);
		const options = await orderPage.getVendorOptions();
		expect(options.filter((option) => option === scenario.parentVendorName)).toHaveLength(1);
		for (const child of hierarchy!.children) {
			if (child.child_name) expect(options).not.toContain(child.child_name);
		}
	});

	test(`${TEST_CASES.resolveMcLaneDcOnOrder} - McLane order is saved against the store's resolved DC`, async ({
		page,
		testData,
	}) => {
		const scenario = getScenarioData();
		await requireStoreContext(scenario.mappedStore, 'the McLane-mapped store');
		test.skip(
			!scenario.mappedStore.resolvedDcVendorCode,
			'Configure the store-resolved DC vendor code in test-data/RCSP-462.json',
		);
		const resolvedVendor = await queryWithResultLog(
			`${TEST_CASES.resolveMcLaneDcOnOrder} resolved DC vendor`,
			testData.getVendorByCode(scenario.mappedStore.resolvedDcVendorCode),
		);
		test.skip(!resolvedVendor, 'Configured resolved DC vendor code is not in the database');

		const orderPage = await openScheduledOrderForm(page, scenario.mappedStore);
		const result = await orderPage.createAndSubmitScheduledOrder(
			[scenario.parentVendorName],
			[{ itemName: scenario.mappedStore.itemName, quantity: '1' }],
			`RCSP-462 ${uniqueVendorCode()}`,
		);
		expect(result.submitted, result.reason).toBeTruthy();
		const poId = Number.parseInt(result.orderNumber?.match(/\d+/)?.[0] ?? '', 10);
		expect(Number.isFinite(poId)).toBeTruthy();

		const purchaseOrder = await queryWithResultLog(
			`${TEST_CASES.resolveMcLaneDcOnOrder} purchase order`,
			testData.getPurchaseOrderById(poId),
		);
		expect(purchaseOrder?.store_id).toBe(scenario.mappedStore.storeId);
		expect(purchaseOrder?.vendor_id).toBe(resolvedVendor!.id);
	});

	test(`${TEST_CASES.rejectOrderWithoutDcMapping} - Order is not created without a valid DC mapping`, async ({
		page,
		testData,
	}) => {
		const scenario = getScenarioData();
		await requireStoreContext(scenario.unmappedStore, 'the store without a McLane DC mapping');
		const before = await queryWithResultLog(
			`${TEST_CASES.rejectOrderWithoutDcMapping} purchase orders before submission`,
			testData.getPurchaseOrderIdsForStore(scenario.unmappedStore.storeId),
		);

		const orderPage = await openScheduledOrderForm(page, scenario.unmappedStore);
		const options = await orderPage.getVendorOptions();
		if (options.includes(scenario.parentVendorName)) {
			await orderPage.selectVendor(scenario.parentVendorName);
			const itemOptions = await orderPage.getItemDropdownOptions();
			test.skip(
				!itemOptions.includes(scenario.unmappedStore.itemName),
				'Configured order item is not available for McLane in the unmapped store',
			);
			const added = await orderPage.addItemsToOrder([
				{ itemName: scenario.unmappedStore.itemName, quantity: '1' },
			]);
			expect(added.addedCount).toBe(1);
			const result = await orderPage.submitCurrentOrder();
			expect(result.submitted, 'An order must not submit without a valid DC mapping').toBeFalsy();
		}
		const after = await queryWithResultLog(
			`${TEST_CASES.rejectOrderWithoutDcMapping} purchase orders after submission`,
			testData.getPurchaseOrderIdsForStore(scenario.unmappedStore.storeId),
		);

		expect(after.sort((left, right) => left - right)).toEqual(
			before.sort((left, right) => left - right),
		);
	});
});
