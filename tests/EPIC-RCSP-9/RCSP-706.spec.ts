import { readFile } from 'node:fs/promises';
import { test, expect } from '../../fixtures/baseTest';
import type { Page } from '@playwright/test';
import { LogWastePage } from '../../pages/Wastage/LogWastePage';
import {
	TestDataRepository,
	type RecipeSkuData,
} from '../../test-data/TestDataRepository';

const STORE_ID = 37;
const DEFAULT_SHIFT = 'AM';
const repository = new TestDataRepository();

function getIngredientQuantity(recipe: RecipeSkuData): number | undefined {
	const entries = Object.entries(recipe.recipe_ingredient_data);
	const preferredKeys = /^(quantity|qty|ingredient_quantity|ingredient_qty|amount)$/i;
	const candidate = entries.find(([key]) => preferredKeys.test(key))
		?? entries.find(([key]) => /quantity|qty|amount/i.test(key));
	const quantity = Number(candidate?.[1]);
	return Number.isFinite(quantity) && quantity > 0 ? quantity : undefined;
}

async function getRecipeData(): Promise<RecipeSkuData> {
	const recipe = await repository.getRecipeNameAndSkuForWaste();
	console.log('SKU from recipe query:', recipe?.sku);
	expect(recipe, 'No recipe and ingredient SKU returned by the database').toBeDefined();
	expect(recipe!.recipe_name).toBeTruthy();
	expect(recipe!.sku).toBeTruthy();
	return recipe!;
}

async function getStockSnapshot(parentSku: string) {
	const stock = await repository.getLatestRecipeIngredientStockByParentSku(parentSku);
	console.log('SKU from stock query:', stock?.sku);
	return stock;
}

async function createRecipeWaste(
	page: Page,
	recipe: RecipeSkuData,
	quantity: string,
): Promise<void> {
	const reason = await repository.getFirstActiveWasteReason();
	const uom = recipe.uom ? await repository.getUomByAbbreviation(recipe.uom) : undefined;
	expect(reason, 'No active waste reason returned by the database').toBeDefined();
	expect(uom, `Recipe unit of measure was not found: ${recipe.uom}`).toBeDefined();

	const logWastePage = new LogWastePage(page);
	await logWastePage.openLogWaste();
	await logWastePage.createWasteLog(DEFAULT_SHIFT);
	await logWastePage.setType('RECIPE');
	await logWastePage.selectSearchableValue(/recipe/i, recipe.recipe_name);
	await logWastePage.selectReason(reason!.description);
	await logWastePage.selectUom(uom!.abbreviation);
	await logWastePage.fillQuantity(quantity);
	await logWastePage.fillNotes(`RCSP-706 ${quantity} ${Date.now()}`);
	await logWastePage.saveWasteLog();
	await logWastePage.lockWasteLog();
	await logWastePage.verifyLockedState();
}

async function applyRecipeWaste(
	page: Page,
	recipe: RecipeSkuData,
	quantity: string,
): Promise<void> {
	await createRecipeWaste(page, recipe, quantity);
	await new LogWastePage(page).applyToStock();
}

async function getSelectedChildBeforeWaste(parentSku: string) {
	const stock = await getStockSnapshot(parentSku);
	expect(stock, `No ingredient stock found for recipe SKU ${parentSku}`).toBeDefined();
	const snapshot = `${stock!.sku},${stock!.qty_on_hand}`;
	console.log('ingredient_sku_qty_variable before:', snapshot);
	return { stock: stock!, snapshot };
}

async function assertAppliedWasteDelta(
	page: Page,
	recipe: RecipeSkuData,
	wasteQuantity: number,
): Promise<{ childSku: string; stockBefore: number; stockAfter: number }> {
	const recipeQuantity = getIngredientQuantity(recipe);
	test.skip(!recipeQuantity, 'Recipe ingredient quantity could not be identified from recipe_ingredient data.');
	const { stock: childBefore } = await getSelectedChildBeforeWaste(recipe.sku);
	const masterBefore = await repository.getStockBySku(recipe.sku);
	console.log('SKU from master stock query:', masterBefore?.sku);
	expect(masterBefore, `Master item stock not found for ${recipe.sku}`).toBeDefined();

	await applyRecipeWaste(page, recipe, String(wasteQuantity));

	const childAfter = await repository.getStockBySku(childBefore.sku);
	console.log('SKU from child stock after query:', childAfter?.sku);
	const masterAfter = await repository.getStockBySku(recipe.sku);
	console.log('SKU from master stock after query:', masterAfter?.sku);
	expect(childAfter, `Child SKU stock not found after waste: ${childBefore.sku}`).toBeDefined();
	expect(masterAfter, `Master stock not found after waste: ${recipe.sku}`).toBeDefined();
	const ingredient_sku_qty_variable_before = `${childBefore.sku},${childBefore.qty_on_hand}`;
	const ingredient_sku_qty_variable_after = `${childAfter!.sku},${childAfter!.qty_on_hand}`;
	console.log('ingredient_sku_qty_variable before:', ingredient_sku_qty_variable_before);
	console.log('ingredient_sku_qty_variable after:', ingredient_sku_qty_variable_after);
	expect(childAfter!.sku).not.toBe(recipe.sku);
	expect(Number(childBefore.qty_on_hand) - Number(childAfter!.qty_on_hand)).toBeCloseTo(
		recipeQuantity! * wasteQuantity,
		4,
	);
	expect(Number(masterAfter!.qty_on_hand)).toBe(Number(masterBefore!.qty_on_hand));
	return {
		childSku: childBefore.sku,
		stockBefore: Number(childBefore.qty_on_hand),
		stockAfter: Number(childAfter!.qty_on_hand),
	};
}

test.describe('RCSP-706 - recipe waste consumes real master child stock', () => {
	test('TC_RCSP-706_01 - waste deducts stock from the real child SKU', { tag: ['@functional'] }, async ({ page, activeStoreContext }) => {
		expect(activeStoreContext.storeName).toBeTruthy();
		const recipe = await getRecipeData();
		await assertAppliedWasteDelta(page, recipe, 1);
	});

	test('TC_RCSP-706_02 - waste selects the oldest eligible child SKU', { tag: ['@functional'] }, async ({ page }) => {
		const recipe = await getRecipeData();
		const recipeQuantity = getIngredientQuantity(recipe);
		test.skip(!recipeQuantity, 'Recipe ingredient quantity could not be identified from recipe_ingredient data.');
		const childLots = await repository.getChildLotsByParentSku(recipe.sku, STORE_ID);
		console.log('Child SKUs in receipt-date order:', childLots.map((child) => child.sku));
		test.skip(childLots.length < 2, 'Need at least two stocked child SKUs to verify oldest-lot selection.');
		const baseline = new Map<string, number>();
		for (const child of childLots) {
			if (!baseline.has(child.sku)) baseline.set(child.sku, Number(child.qty_on_hand));
		}
		const oldestSku = childLots[0].sku;
		test.skip(Number(baseline.get(oldestSku)) < recipeQuantity!, 'Oldest child SKU does not have enough stock for one recipe unit.');

		await applyRecipeWaste(page, recipe, '1');
		const changedSkus: string[] = [];
		for (const [sku, before] of baseline) {
			const after = await repository.getStockBySku(sku);
			console.log('SKU from child FIFO verification query:', after?.sku);
			if (after && Number(after.qty_on_hand) < before) changedSkus.push(sku);
		}
		expect(changedSkus).toEqual([oldestSku]);
	});

	test('TC_RCSP-706_03 - one recipe waste deducts exactly the recipe ingredient quantity', { tag: ['@functional'] }, async ({ page }) => {
		const recipe = await getRecipeData();
		await assertAppliedWasteDelta(page, recipe, 1);
	});

	test('TC_RCSP-706_04 - multiple recipe units multiply the child stock deduction', { tag: ['@functional'] }, async ({ page }) => {
		const recipe = await getRecipeData();
		const recipeQuantity = getIngredientQuantity(recipe);
		test.skip(!recipeQuantity, 'Recipe ingredient quantity could not be identified from recipe_ingredient data.');
		const { stock } = await getSelectedChildBeforeWaste(recipe.sku);
		test.skip(Number(stock!.qty_on_hand) < recipeQuantity! * 3, 'Selected child SKU lacks stock for three recipe units.');
		await assertAppliedWasteDelta(page, recipe, 3);
	});

	test('TC_RCSP-706_05 - waste application is blocked when child stock is insufficient', { tag: ['@functional'] }, async ({ page }) => {
		const recipe = await getRecipeData();
		const recipeQuantity = getIngredientQuantity(recipe);
		test.skip(!recipeQuantity, 'Recipe ingredient quantity could not be identified from recipe_ingredient data.');
		const childLots = await repository.getChildLotsByParentSku(recipe.sku, STORE_ID);
		const stockBySku = new Map<string, number>();
		for (const child of childLots) stockBySku.set(child.sku, Number(child.qty_on_hand));
		const totalStock = [...stockBySku.values()].reduce((sum, stock) => sum + stock, 0);
		const requestedStock = recipeQuantity! * 3.5;
		test.skip(totalStock >= requestedStock, `Current child stock (${totalStock}) is sufficient for 3.5 recipe units.`);

		await createRecipeWaste(page, recipe, '3.5');
		const logWastePage = new LogWastePage(page);
		await logWastePage.applyToStockButton.click();
		const error = page.getByText(/not enough in stock/i).first();
		const confirmation = page.getByRole('dialog').last();
		const confirmButton = confirmation.getByRole('button', { name: /^(ok|yes|confirm|apply)$/i });
		if (!(await error.isVisible().catch(() => false)) && await confirmButton.isVisible().catch(() => false)) {
			await confirmButton.click();
		}
		await expect(error).toBeVisible({ timeout: 15000 });
		const message = await error.innerText();
		expect(message).not.toContain(recipe.sku);
		expect(message).toMatch(/\d{4,}/);
	});

	test('TC_RCSP-706_06 - waste detail identifies the real child SKU', { tag: ['@functional'] }, async ({ page }) => {
		const recipe = await getRecipeData();
		const { stock } = await getSelectedChildBeforeWaste(recipe.sku);
		await applyRecipeWaste(page, recipe, '1');
		await expect(page.getByText(stock!.sku, { exact: false }).first()).toBeVisible({ timeout: 10000 });
		await expect(page.getByText(recipe.sku, { exact: false })).toHaveCount(0);
	});

	test('TC_RCSP-706_07 - waste export contains the real child SKU', { tag: ['@functional'] }, async ({ page }) => {
		const recipe = await getRecipeData();
		const { stock } = await getSelectedChildBeforeWaste(recipe.sku);
		await applyRecipeWaste(page, recipe, '1');
		const logWastePage = new LogWastePage(page);
		await logWastePage.openWasteHistory();
		const exportButton = page.getByRole('button', { name: /export|download/i }).first();
		await expect(exportButton, 'Waste History must expose a waste export/download control').toBeVisible({ timeout: 10000 });
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			exportButton.click(),
		]);
		const filePath = await download.path();
		expect(filePath, 'Waste export did not produce a downloadable file').toBeTruthy();
		const exportText = (await readFile(filePath!)).toString('utf8');
		expect(exportText).toContain(stock!.sku);
		expect(exportText).not.toContain(recipe.sku);
	});

	test('TC_RCSP-706_08 - applying recipe waste leaves master stock unchanged', { tag: ['@functional'] }, async ({ page }) => {
		const recipe = await getRecipeData();
		await assertAppliedWasteDelta(page, recipe, 1);
	});
});
