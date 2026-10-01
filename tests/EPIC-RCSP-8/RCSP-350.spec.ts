import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { VendorItemsPage } from '../../pages/Inventory/VendorItemsPage';
import { OrderHistoryPage } from '../../pages/Ordering/OrderHistoryPage';
import { ScheduledOrderPage } from '../../pages/Ordering/ScheduledOrderPage';
import { TestDataRepository } from '../../test-data/TestDataRepository';

const ALLOWED_ORDER_TYPES = ['scheduled', 'hotshot'];
const repository = new TestDataRepository();

async function openOrderHistory(page: import('@playwright/test').Page): Promise<OrderHistoryPage> {
	const sidebar = page.getByRole('complementary').first();
	const ordering = sidebar.getByRole('button', { name: /^ordering$/i });
	const link = sidebar.getByRole('link', { name: /^order history$/i });
	if (!(await link.isVisible().catch(() => false))) await ordering.click();
	await expect(link).toBeVisible({ timeout: 10000 });
	await link.click();
	await page.waitForLoadState('networkidle').catch(() => undefined);
	const orderHistoryPage = new OrderHistoryPage(page);
	await orderHistoryPage.waitForOrderHistoryPageToLoad();
	return orderHistoryPage;
}

async function openScheduledOrders(page: import('@playwright/test').Page): Promise<ScheduledOrderPage> {
	const sidebar = page.getByRole('complementary').first();
	const ordering = sidebar.getByRole('button', { name: /^ordering$/i });
	const link = sidebar.getByRole('link', { name: /^scheduled orders$/i });
	if (!(await link.isVisible().catch(() => false))) await ordering.click();
	await expect(link).toBeVisible({ timeout: 10000 });
	await link.click();
	await page.waitForLoadState('networkidle').catch(() => undefined);
	const scheduledOrderPage = new ScheduledOrderPage(page);
	await scheduledOrderPage.verifyScheduledOrdersPageLoaded();
	return scheduledOrderPage;
}

async function orderTypeCells(page: import('@playwright/test').Page): Promise<string[]> {
	const headers = page.getByRole('columnheader');
	let orderTypeIndex = -1;
	for (let index = 0; index < await headers.count(); index += 1) {
		if (/^order type$/i.test((await headers.nth(index).innerText()).trim())) {
			orderTypeIndex = index;
			break;
		}
	}
	expect(orderTypeIndex, 'Order Type column header was not found').toBeGreaterThanOrEqual(0);
	const rows = page.getByRole('row').filter({ hasText: /PO-/i });
	const values: string[] = [];
	for (let index = 0; index < await rows.count(); index += 1) {
		const cell = rows.nth(index).getByRole('cell').nth(orderTypeIndex);
		const text = (await cell.innerText().catch(() => '')).trim().toLowerCase();
		if (text) values.push(text);
	}
	return values;
}

async function openVendorAdmin(page: import('@playwright/test').Page): Promise<boolean> {
	const setupMenu = page.getByRole('complementary').first().getByRole('button', { name: /inventory setup/i });
	const vendorLink = page.getByRole('link', { name: /^vendors?$/i })
		.or(page.getByRole('button', { name: /^vendors?$/i }))
		.first();
	if (!(await vendorLink.isVisible().catch(() => false))) {
		await setupMenu.click().catch(() => undefined);
	}
	if (!(await vendorLink.isVisible({ timeout: 5000 }).catch(() => false))) return false;
	await vendorLink.click();
	await page.waitForLoadState('networkidle').catch(() => undefined);
	return true;
}

async function getVendorDropdownOptions(page: import('@playwright/test').Page): Promise<string[]> {
	const filter = page.getByRole('button', { name: /^all vendors$/i }).first();
	await expect(filter, 'Vendor Items All Vendors filter was not found').toBeVisible({ timeout: 15000 });
	await filter.click();
	const options = page.getByRole('option').or(page.locator('[role="listbox"] button, [data-option="true"], li[role="option"]'));
	const labels: string[] = [];
	for (let index = 0; index < await options.count(); index += 1) {
		if (await options.nth(index).isVisible().catch(() => false)) {
			const label = (await options.nth(index).innerText()).trim();
			if (label) labels.push(label);
		}
	}
	await page.keyboard.press('Escape').catch(() => undefined);
	return labels;
}

async function loginAdmin(page: import('@playwright/test').Page): Promise<void> {
	await page.goto(CONFIG.dashboardURL);
	await new RTCDashboardLoginPage(page).login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
}

test.describe('RCSP-350 - Purchase Order type and vendor ordering', () => {
	test.setTimeout(120000);

	test('TC_RCSP-350_01 - purchase_order has the order_type column', { tag: ['@smoke', '@functional'] }, async () => {
		expect(await repository.hasPurchaseOrderTypeColumn()).toBeTruthy();
	});

	test('TC_RCSP-350_02 - stored order_type values are only scheduled or hotshot', { tag: ['@functional'] }, async () => {
		const orderTypes = await repository.getDistinctPurchaseOrderTypes();
		const order_type_variable = orderTypes.join(',');
		console.log('Distinct purchase_order.order_type values:', order_type_variable);
		expect(orderTypes.length, 'No non-null purchase_order.order_type values were returned').toBeGreaterThan(0);
		for (const value of orderTypes) expect(ALLOWED_ORDER_TYPES).toContain(value.toLowerCase());
	});

	test('TC_RCSP-350_03 - All Vendors dropdown includes every ordering-enabled vendor', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBeTruthy();
		const vendor_names_variable = await repository.getOrderingAllowedVendorNames();
		console.log('Ordering-enabled vendors from DB:', vendor_names_variable.join(', '));
		test.skip(vendor_names_variable.length === 0, 'No vendors have ordering_allowed=true in the database.');
		const vendorItemsPage = new VendorItemsPage(page);
		await vendorItemsPage.navigateToVendorItems();
		await expect(page.getByText(/^loading\.\.\.$/i)).toBeHidden({ timeout: 30000 });
		for (const vendor of vendor_names_variable) {
			const dropdownOptions = await getVendorDropdownOptions(page);
			expect(dropdownOptions.some((option) => option.toLowerCase() === vendor.toLowerCase()), `Vendor missing from All Vendors dropdown: ${vendor}`).toBeTruthy();
			const option = page.getByRole('option', { name: vendor, exact: true })
				.or(page.getByRole('button', { name: vendor, exact: true }))
				.or(page.getByText(vendor, { exact: true }))
				.last();
			await option.click();
			await expect(page.getByRole('button', { name: new RegExp(vendor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first()).toBeVisible();
		}
	});

	test('TC_RCSP-350_04 - Vendor records expose Edit and editable details', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBeTruthy();
		const opened = await openVendorAdmin(page);
		test.skip(!opened, 'Vendor administration page is not exposed in this QA navigation.');
		const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
		test.skip(await dataRows.count() === 0, 'Vendor administration list has no records.');
		const rows = Math.min(await dataRows.count(), 5);
		for (let index = 0; index < rows; index += 1) {
			const row = dataRows.nth(index);
			const edit = row.getByRole('button', { name: /edit/i })
				.or(row.locator('[aria-label*="edit" i], [title*="edit" i]'))
				.first();
			await expect(edit, `Vendor row ${index + 1} should expose Edit`).toBeVisible();
		}
		await dataRows.first().getByRole('button', { name: /edit/i }).click();
		await expect(page.locator('main input:not([type="hidden"]):not([disabled]), main textarea').first()).toBeEditable();
	});

	test('TC_RCSP-350_05 - admin can update and persist a vendor field', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBeTruthy();
		const opened = await openVendorAdmin(page);
		test.skip(!opened, 'Vendor administration page is not exposed in this QA navigation.');
		const row = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first();
		test.skip(!(await row.isVisible().catch(() => false)), 'Vendor administration list has no records.');
		const edit = row.getByRole('button', { name: /edit/i })
			.or(row.locator('[aria-label*="edit" i], [title*="edit" i]'))
			.first();
		await edit.click();
		const nameInput = page.getByLabel(/vendor name|^name$/i).or(page.getByPlaceholder(/vendor name/i)).first();
		test.skip(!(await nameInput.isVisible().catch(() => false)), 'Vendor edit form does not expose an editable name field.');
		const original = await nameInput.inputValue();
		const updated = `${original} RCSP350`;
		const save = page.getByRole('button', { name: /^save$/i }).last();
		try {
			await nameInput.fill(updated);
			await save.click();
			await page.waitForLoadState('networkidle').catch(() => undefined);
			await expect(page.getByText(updated, { exact: true })).toBeVisible({ timeout: 15000 });
		} finally {
			const updatedRow = page.getByRole('row').filter({ hasText: updated }).first();
			if (await updatedRow.isVisible().catch(() => false)) {
				await updatedRow.getByRole('button', { name: /edit/i }).click().catch(() => undefined);
				const restoreInput = page.getByLabel(/vendor name|^name$/i).or(page.getByPlaceholder(/vendor name/i)).first();
				if (await restoreInput.isVisible().catch(() => false)) {
					await restoreInput.fill(original);
					await page.getByRole('button', { name: /^save$/i }).last().click();
					await page.waitForLoadState('networkidle').catch(() => undefined);
				}
			}
		}
	});

	test('TC_RCSP-350_06 - Order History list includes the Order Type header', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBeTruthy();
		const history = await openOrderHistory(page);
		await expect(history.orderTypeHeader).toBeVisible();
	});

	test('TC_RCSP-350_07 - Scheduled Orders list includes the Order Type header', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBeTruthy();
		const scheduled = await openScheduledOrders(page);
		await expect(scheduled.orderTypeHeader).toBeVisible();
	});

	test('TC_RCSP-350_08 - Order History displays supported database order types', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBeTruthy();
		const dbOrderTypes = await repository.getDistinctPurchaseOrderTypes();
		test.skip(dbOrderTypes.length === 0, 'No purchase_order order_type values are available.');
		const history = await openOrderHistory(page);
		await expect(history.orderTypeHeader).toBeVisible();
		const values = await history.getVisibleOrderTypes();
		test.skip(values.length === 0, 'Order History has no visible rows with an Order Type value.');
		for (const value of values) {
			expect(ALLOWED_ORDER_TYPES).toContain(value.toLowerCase());
			expect(dbOrderTypes.map((type) => type.toLowerCase())).toContain(value.toLowerCase());
		}
	});

	test('TC_RCSP-350_09 - Scheduled Orders displays supported Order Type values', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBeTruthy();
		const dbOrderTypes = await repository.getDistinctPurchaseOrderTypes();
		test.skip(dbOrderTypes.length === 0, 'No purchase_order order_type values are available.');
		const scheduled = await openScheduledOrders(page);
		await expect(scheduled.orderTypeHeader).toBeVisible();
		const values = await orderTypeCells(page);
		test.skip(values.length === 0, 'Scheduled Orders has no visible rows with an Order Type value.');
		for (const value of values) {
			expect(ALLOWED_ORDER_TYPES).toContain(value);
			expect(dbOrderTypes.map((type) => type.toLowerCase())).toContain(value);
		}
	});

	test('TC_RCSP-350_10 - no unsupported order_type values exist', { tag: ['@functional'] }, async () => {
		const orderTypes = await repository.getDistinctPurchaseOrderTypes();
		const order_type_variable = orderTypes.join(',');
		console.log('Distinct purchase_order.order_type values:', order_type_variable);
		for (const value of orderTypes) expect(ALLOWED_ORDER_TYPES).toContain(value.toLowerCase());
	});
});
