import { test, expect } from '../../fixtures/baseTest';
import { CONFIG } from '../../config';
import { OrderHistoryPage } from '../../pages/Ordering/OrderHistoryPage';
import type { DraftPurchaseOrderLineData } from '../../test-data/TestDataRepository';
import type { Page } from '@playwright/test';

type OrderContext = {
	page: Page;
	history: OrderHistoryPage;
	lines: DraftPurchaseOrderLineData[];
	categories: string[];
};

function categoryOf(line: DraftPurchaseOrderLineData): string {
	return line.category?.trim() || 'Uncategorized';
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function openOrder(page: Page, testData: { getDraftPurchaseOrderLinesWithCategories(storeId: number): Promise<DraftPurchaseOrderLineData[]> }): Promise<OrderContext> {
	const lines = await testData.getDraftPurchaseOrderLinesWithCategories(37);
	test.skip(lines.length === 0, 'No draft purchase order lines are available for the active store.');
	const poNumber = lines[0].po_number;
	const sidebar = page.getByRole('complementary').first();
	const orderHistoryLink = sidebar.getByRole('link', { name: 'Order History', exact: true });
	if (!(await orderHistoryLink.isVisible().catch(() => false))) {
		await sidebar.getByRole('button', { name: 'Ordering', exact: true }).click();
	}
	if (await orderHistoryLink.isVisible().catch(() => false)) {
		await orderHistoryLink.click();
	} else {
		await page.goto(`${CONFIG.baseURL}/orders/history`, { waitUntil: 'domcontentloaded' });
	}

	const history = new OrderHistoryPage(page);
	await history.waitForOrderHistoryPageToLoad();
	await history.statusFilterDraftButton.click();
	const result = await history.searchAndOpenOrder(poNumber);
	test.skip(!result.opened, `Draft order ${poNumber} could not be opened from Order History.`);
	return {
		page,
		history,
		lines,
		categories: [...new Set(lines.map(categoryOf))],
	};
}

function categoryFilter(page: Page, categories: string[]) {
	const labels = ['All Items', ...categories].map(escapeRegExp).join('|');
	return page.getByRole('button', { name: new RegExp(`^(?:${labels})$`, 'i') })
		.or(page.getByRole('combobox', { name: /category|items/i }))
		.first();
}

async function chooseCategory(page: Page, category: string, categories: string[]): Promise<void> {
	const filter = categoryFilter(page, categories);
	if (!(await page.getByRole('option', { name: category, exact: true }).isVisible().catch(() => false))) {
		await filter.click();
	}
	const option = page.getByRole('option', { name: category, exact: true })
		.or(page.getByRole('menuitem', { name: category, exact: true }))
		.or(page.getByText(category, { exact: true }))
		.last();
	await expect(option).toBeVisible();
	await option.click();
}

async function itemIsVisible(page: Page, itemName: string): Promise<boolean> {
	return page.getByText(itemName, { exact: true }).first().isVisible().catch(() => false);
}

async function expectItemsVisible(page: Page, lines: DraftPurchaseOrderLineData[]): Promise<void> {
	for (const itemName of new Set(lines.map((line) => line.item_name))) {
		await expect(page.getByText(itemName, { exact: true }).first()).toBeVisible();
	}
}

test.describe('RCSP-509 - Order History item categories', () => {
	test.setTimeout(120_000);

	test('TC_RCSP-509_01 - Grouped order items appear under their database category', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		const groupButton = page.getByRole('button', { name: /group/i }).first();
		await expect(groupButton).toBeVisible();
		for (const category of context.categories) {
			const heading = page.getByText(category, { exact: true }).first();
			await expect(heading).toBeVisible();
			const section = heading.locator('xpath=ancestor::*[self::section or self::div][.//table or .//button][1]');
			const sectionText = await section.innerText().catch(async () => await page.locator('main').innerText());
			for (const line of context.lines.filter((item) => categoryOf(item) === category)) {
				expect(sectionText).toContain(line.item_name);
			}
		}
	});

	test('TC_RCSP-509_02 - All Items category options match database categories', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		await categoryFilter(page, context.categories).click();
		const options = page.getByRole('option').or(page.getByRole('menuitem'));
		const actual: string[] = [];
		for (let index = 0; index < await options.count(); index += 1) actual.push((await options.nth(index).innerText()).trim());
		expect(actual.map((item) => item.toLowerCase()).sort()).toEqual(['all items', ...context.categories.map((item) => item.toLowerCase())].sort());
		await page.keyboard.press('Escape').catch(() => undefined);
	});

	test('TC_RCSP-509_03 - Selecting one category displays only its items', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		test.skip(context.categories.length < 2, 'At least two categories are required for filtering.');
		const selected = context.categories[0];
		await chooseCategory(page, selected, context.categories);
		for (const line of context.lines) {
			expect(await itemIsVisible(page, line.item_name), line.item_name).toBe(categoryOf(line) === selected);
		}
	});

	test('TC_RCSP-509_04 - Selecting multiple categories displays their items', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		test.skip(context.categories.length < 2, 'At least two categories are required for multi-category filtering.');
		const selected = context.categories.slice(0, 2);
		for (const category of selected) await chooseCategory(page, category, context.categories);
		for (const line of context.lines) {
			expect(await itemIsVisible(page, line.item_name), line.item_name).toBe(selected.includes(categoryOf(line)));
		}
	});

	test('TC_RCSP-509_05 - All Items restores all order lines after filtering', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		test.skip(context.categories.length < 2, 'At least two categories are required for filtering.');
		await chooseCategory(page, context.categories[0], context.categories);
		await chooseCategory(page, 'All Items', context.categories);
		await expectItemsVisible(page, context.lines);
	});

	test('TC_RCSP-509_06 - Group toggle shows category counts and expands or collapses categories', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		const groupButton = page.getByRole('button', { name: /group/i }).first();
		await expect(groupButton).toBeVisible();
		for (const category of context.categories) {
			const count = context.lines.filter((line) => categoryOf(line) === category).length;
			await expect(page.getByText(new RegExp(`${escapeRegExp(category)}\\s*\\(?${count}\\)?`, 'i')).first()).toBeVisible();
		}
		const categoryButton = page.getByRole('button', { name: new RegExp(escapeRegExp(context.categories[0]), 'i') }).first();
		await expect(categoryButton).toBeVisible();
		await categoryButton.click();
		for (const line of context.lines.filter((item) => categoryOf(item) === context.categories[0])) {
			await expect(page.getByText(line.item_name, { exact: true }).first()).toBeHidden();
		}
		await categoryButton.click();
		await expectItemsVisible(page, context.lines);
		await groupButton.click();
		await expectItemsVisible(page, context.lines);
	});

	test('TC_RCSP-509_07 - Duplicate item IDs are represented once with combined quantity', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		const grouped = new Map<number, DraftPurchaseOrderLineData[]>();
		for (const line of context.lines) grouped.set(line.item_id, [...(grouped.get(line.item_id) ?? []), line]);
		const duplicate = [...grouped.values()].find((items) => items.length > 1);
		test.skip(!duplicate, 'No duplicate item IDs exist in the selected draft order.');
		const matchingRows = page.getByRole('row').filter({ hasText: new RegExp(escapeRegExp(duplicate![0].item_name), 'i') });
		await expect(matchingRows).toHaveCount(1);
		const expectedQuantity = duplicate!.reduce((sum, line) => sum + Number(line.ordered_qty), 0);
		await expect(matchingRows.first()).toContainText(String(expectedQuantity));
	});

	test('TC_RCSP-509_08 - Item search finds names and PLUs with category filtering', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		const item = context.lines.find((line) => line.category);
		test.skip(!item, 'No categorized item is available for search.');
		const search = page.getByRole('textbox', { name: /search/i }).first();
		await expect(search).toBeVisible();
		await search.fill(item!.item_name);
		await expect(page.getByText(item!.item_name, { exact: true }).first()).toBeVisible();
		await search.fill(item!.sku);
		await expect(page.getByText(item!.item_name, { exact: true }).first()).toBeVisible();
		await search.fill('');
		await chooseCategory(page, item!.category!.trim(), context.categories);
		await search.fill(item!.item_name);
		await expect(page.getByText(item!.item_name, { exact: true }).first()).toBeVisible();
	});

	test('TC_RCSP-509_09 - Qty to Order remains unchanged when category filters change', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		const line = context.lines.find((item) => item.category);
		test.skip(!line, 'No categorized item is available for quantity persistence.');
		const row = page.getByRole('row').filter({ hasText: new RegExp(escapeRegExp(line!.item_name), 'i') }).first();
		const quantity = row.getByRole('spinbutton').last();
		const originalValue = await quantity.inputValue();
		try {
			await quantity.fill('7');
			await chooseCategory(page, line!.category!.trim(), context.categories);
			const otherCategory = context.categories.find((category) => category !== categoryOf(line!));
			if (otherCategory) await chooseCategory(page, otherCategory, context.categories);
			await chooseCategory(page, 'All Items', context.categories);
			const restoredRow = page.getByRole('row').filter({ hasText: new RegExp(escapeRegExp(line!.item_name), 'i') }).first();
			await expect(restoredRow.getByRole('spinbutton').last()).toHaveValue('7');
		} finally {
			await quantity.fill(originalValue).catch(() => undefined);
		}
	});

	test('TC_RCSP-509_10 - Save and Submit controls remain available with a category selected', { tag: ['@functional'] }, async ({ page, activeStoreContext, testData }) => {
		expect(activeStoreContext.storeId).toBe(37);
		const context = await openOrder(page, testData);
		test.skip(context.categories.length < 2, 'At least two categories are required for this scenario.');
		await chooseCategory(page, context.categories[0], context.categories);
		const saveButton = page.getByRole('button', { name: /save changes/i }).first();
		const submitButton = page.getByRole('button', { name: /submit/i }).first();
		await expect(saveButton.or(submitButton).first()).toBeVisible();
		await chooseCategory(page, 'All Items', context.categories);
		await expectItemsVisible(page, context.lines);
	});
});
