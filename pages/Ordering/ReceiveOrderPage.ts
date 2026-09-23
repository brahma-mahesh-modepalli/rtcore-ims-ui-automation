/**
 * ReceiveOrderPage – Page Object
 * ==============================
 * Locators and actions for Ordering → Receive Order
 * used by RCSP-246 (transmitted order delivery confirmation flow).
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class ReceiveOrderPage {
	readonly pageTitle: Locator;
	readonly allTabButton: Locator;
	readonly searchInput: Locator;
	readonly headerTable: Locator;
	readonly ordersTable: Locator;
	readonly completeDeliveryButton: Locator;
	readonly confirmButton: Locator;
	readonly addItemButton: Locator;
	readonly willCallOrderButton: Locator;
	readonly exportButton: Locator;
	readonly printButton: Locator;

	constructor(private readonly page: Page) {
		this.pageTitle = page.getByRole('heading', { name: /receive order/i }).first();
		this.allTabButton = page
			.getByRole('tab', { name: /^all$/i })
			.or(page.getByRole('button', { name: /^all$/i }))
			.first();
		this.searchInput = page
			.getByPlaceholder(/search.*(po|order)/i)
			.or(page.getByRole('textbox', { name: /search/i }))
			.first();
		// The grid renders separate header and body tables; rows only exist in the last table.
		this.headerTable = page.getByRole('table').first();
		this.ordersTable = page.getByRole('table').last();
		this.completeDeliveryButton = page.getByRole('button', { name: /complete delivery/i });
		this.confirmButton = page
			.getByRole('button', { name: /^(confirm|yes)$/i })
			.first();
		this.addItemButton = page.getByRole('button', { name: /^add item$/i });
		// Live UI exposes this as the "New Delivery" button; it opens the Will Call order-type dropdown.
		this.willCallOrderButton = page.getByRole('button', { name: /new delivery/i });
		this.exportButton = page.getByRole('button', { name: /^export$/i });
		this.printButton = page.getByRole('button', { name: /^print$/i });
	}


	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	async open(): Promise<void> {
		log('Opening Ordering → Receive Order');
		await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
		await expect(this.pageTitle).toBeVisible({ timeout: 15_000 });
		if (await this.allTabButton.isVisible().catch(() => false)) {
			await this.allTabButton.click();
			await this.page.waitForLoadState('networkidle').catch(() => undefined);
		}
	}

	private orderRow(poNumber: string): Locator {
		return this.ordersTable
			.getByRole('row')
			.filter({ hasText: new RegExp(this.escapeRegExp(poNumber), 'i') })
			.first();
	}

	async searchOrder(poNumber: string): Promise<void> {
		if (await this.searchInput.isVisible().catch(() => false)) {
			await this.searchInput.fill(poNumber);
			await this.page.waitForTimeout(500);
			return;
		}

		await expect(this.orderRow(poNumber)).toBeVisible({ timeout: 15_000 });
	}

	async orderRowVisible(poNumber: string): Promise<boolean> {
		if (await this.searchInput.isVisible().catch(() => false)) {
			await this.searchInput.fill(poNumber);
			await this.page.waitForTimeout(500);
		}
		return this.orderRow(poNumber).isVisible().catch(() => false);
	}

	async verifyStatusPending(poNumber: string): Promise<boolean> {
		const row = this.orderRow(poNumber);
		if (!(await row.isVisible().catch(() => false))) {
			return false;
		}

		return row.getByText(/pending/i).first().isVisible().catch(() => false);
	}

	async openOrder(poNumber: string): Promise<boolean> {
		const row = this.orderRow(poNumber);
		if (!(await row.isVisible().catch(() => false))) {
			return false;
		}

		const trigger = row.getByRole('button', { name: new RegExp(this.escapeRegExp(poNumber), 'i') }).first();
		if (await trigger.isVisible().catch(() => false)) {
			await trigger.click();
		} else {
			await row.click();
		}

		await this.page.waitForLoadState('networkidle').catch(() => undefined);
		return true;
	}

	receivedFields(): Locator {
		return this.page.locator('main').getByLabel(/received/i).or(
			this.page.locator('main input[type="number"]'),
		);
	}

	async verifyReceivedFieldsEditable(): Promise<void> {
		const fields = this.receivedFields();
		const count = await fields.count();
		expect(count, 'Expected Received fields to be present').toBeGreaterThan(0);

		for (let index = 0; index < count; index += 1) {
			await expect(fields.nth(index)).toBeEditable();
		}
	}

	async verifyReceivedFieldsPopulatedAndReadOnly(): Promise<void> {
		const fields = this.receivedFields();
		const count = await fields.count();
		expect(count, 'Expected Received fields to be present').toBeGreaterThan(0);

		for (let index = 0; index < count; index += 1) {
			const field = fields.nth(index);
			const value = await field.inputValue().catch(() => '');
			expect(value, 'Expected Received value to remain populated').not.toBe('');
			await expect(field).not.toBeEditable();
		}
	}

	async completeDelivery(): Promise<void> {
		await expect(this.completeDeliveryButton).toBeEnabled();
		await this.completeDeliveryButton.click();
		if (await this.confirmButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
			await this.confirmButton.click();
		}
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	// ── PO list (RCSP-24_01) ────────────────────────────────

	private listRows(): Locator {
		return this.ordersTable.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
	}

	async verifyPoListColumnsVisible(): Promise<void> {
		for (const column of [/vendor/i, /po\s*#/i, /est\.?\s*delivery/i, /status/i]) {
			await expect(this.headerTable.getByRole('columnheader', { name: column })).toBeVisible();
		}
	}

	async getExpectedDeliveryDateSequence(): Promise<number[]> {
		const headers = this.headerTable.getByRole('columnheader');
		let dateColumnIndex = -1;
		for (let index = 0; index < await headers.count(); index += 1) {
			if (/est\.?\s*delivery/i.test((await headers.nth(index).innerText()).trim())) {
				dateColumnIndex = index;
				break;
			}
		}
		if (dateColumnIndex < 0) return [];

		const rows = this.listRows();
		const dates: number[] = [];
		for (let index = 0; index < await rows.count(); index += 1) {
			const cells = rows.nth(index).getByRole('cell');
			if (await cells.count() > dateColumnIndex) {
				const value = (await cells.nth(dateColumnIndex).innerText()).trim();
				const parsed = Date.parse(value);
				if (!Number.isNaN(parsed)) dates.push(parsed);
			}
		}
		return dates;
	}

	// ── Receiving Detail line items (RCSP-24_02/03) ─────────

	lineItemsTable(): Locator {
		return this.page.getByRole('table').last();
	}

	private lineItemRow(itemName: string): Locator {
		return this.lineItemsTable()
			.getByRole('row')
			.filter({ hasText: new RegExp(this.escapeRegExp(itemName), 'i') })
			.first();
	}

	async verifyLineItemColumnsVisible(): Promise<void> {
		for (const column of [/item name/i, /ordered qty/i, /shipped qty/i, /received qty/i]) {
			await expect(this.lineItemsTable().getByRole('columnheader', { name: column })).toBeVisible();
		}
	}

	private receivedQtyInput(itemName: string): Locator {
		return this.lineItemRow(itemName).locator('input[type="number"]').last();
	}

	async getReceivedQtyValue(itemName: string): Promise<string> {
		return this.receivedQtyInput(itemName).inputValue().catch(() => '');
	}

	async setReceivedQty(itemName: string, value: string): Promise<void> {
		const input = this.receivedQtyInput(itemName);
		await expect(input).toBeEditable();
		await input.fill(value);
		await input.blur().catch(() => undefined);
	}

	async verifyLineFlaggedForQuantityDifference(itemName: string): Promise<void> {
		const row = this.lineItemRow(itemName);
		await expect(
			row.locator('[class*="warn" i], [class*="flag" i], [class*="highlight" i], [role="alert"]')
				.or(row.getByText(/mismatch|differs|variance/i)),
		).toBeVisible({ timeout: 10_000 });
	}

	// ── Add Item (RCSP-24_04) ────────────────────────────────

	async openAddItem(): Promise<void> {
		await expect(this.addItemButton).toBeVisible();
		await this.addItemButton.click();
	}

	async searchAndSelectAddItem(term: string): Promise<void> {
		const searchField = this.page.getByPlaceholder(/search.*item/i).or(this.page.getByRole('textbox', { name: /item/i })).first();
		await expect(searchField).toBeVisible({ timeout: 10_000 });
		await searchField.fill(term);
		await this.page.waitForTimeout(500);
		const option = this.page.getByRole('option', { name: new RegExp(this.escapeRegExp(term), 'i') }).first();
		await expect(option).toBeVisible({ timeout: 10_000 });
		await option.click();
	}

	async verifyItemAddedAsLastLine(itemName: string): Promise<void> {
		const rows = this.lineItemsTable().locator('tbody tr');
		await expect(rows.last()).toContainText(new RegExp(this.escapeRegExp(itemName), 'i'), { timeout: 10_000 });
	}

	// ── Will Call Order (RCSP-24_05/06) ─────────────────────

	async openWillCallOrder(): Promise<void> {
		await expect(this.willCallOrderButton).toBeVisible();
		await this.willCallOrderButton.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	async verifyOrderTypeOptionsVisible(orderTypes: string[]): Promise<void> {
		for (const orderType of orderTypes) {
			await expect(
				this.page.getByRole('option', { name: orderType }).or(this.page.getByText(orderType, { exact: false })).first(),
			).toBeVisible({ timeout: 10_000 });
		}
	}

	async selectOrderType(orderType: string): Promise<void> {
		const option = this.page
			.getByRole('option', { name: orderType })
			.or(this.page.getByRole('button', { name: orderType }))
			.or(this.page.getByText(orderType, { exact: false }))
			.first();
		await expect(option).toBeVisible({ timeout: 10_000 });
		await option.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	async verifyWillCallOrderUnavailable(): Promise<void> {
		await expect(this.willCallOrderButton).toHaveCount(0);
	}

	async verifyWillCallFormFields(): Promise<void> {
		await expect(this.page.getByLabel(/vendor/i).or(this.page.getByRole('combobox', { name: /vendor/i })).first()).toBeVisible();
		await expect(this.page.getByPlaceholder(/search.*item/i).or(this.page.getByRole('textbox', { name: /item/i })).first()).toBeVisible();
		await expect(this.page.getByLabel(/quantity/i).or(this.page.locator('input[type="number"]')).first()).toBeVisible();
		await expect(this.page.getByText(/unit of measure|uom/i).first()).toBeVisible();
		await expect(this.page.getByText(/unit cost/i).first()).toBeVisible();
	}

	async selectWillCallVendor(vendor: string): Promise<void> {
		const vendorControl = this.page.getByLabel(/vendor/i).or(this.page.getByRole('combobox', { name: /vendor/i })).first();
		await vendorControl.click();
		await this.page.getByRole('option', { name: vendor, exact: true }).click();
	}

	async enterManualRetailItem(details: { description: string; quantity: string; uom?: string; cost: string }): Promise<void> {
		const descriptionInput = this.page.getByLabel(/description|item description/i).or(this.page.getByPlaceholder(/description/i)).first();
		await expect(descriptionInput).toBeVisible({ timeout: 10_000 });
		await descriptionInput.fill(details.description);

		const quantityInput = this.page.getByLabel(/quantity/i).or(this.page.locator('input[type="number"]')).first();
		await quantityInput.fill(details.quantity);

		if (details.uom) {
			const uomControl = this.page.getByLabel(/^uom$|unit of measure/i).first();
			if (await uomControl.isVisible().catch(() => false)) {
				await uomControl.click();
				await this.page.getByRole('option', { name: details.uom, exact: true }).click();
			}
		}

		const costInput = this.page.getByLabel(/^cost$|unit cost/i).first();
		await expect(costInput).toBeEditable();
		await costInput.fill(details.cost);
	}

	async getUomDropdownDefault(): Promise<string> {
		const uomControl = this.page.getByLabel(/^uom$|unit of measure/i).first();
		return (await uomControl.inputValue().catch(async () => (await uomControl.textContent()) ?? '')).trim();
	}

	async submitNewDelivery(): Promise<{ submitted: boolean; poNumber?: string; reason?: string }> {
		const submitButton = this.completeDeliveryButton
			.or(this.page.getByRole('button', { name: /^(submit|complete)( delivery)?$/i }))
			.first();
		if (!(await submitButton.isVisible().catch(() => false))) {
			return { submitted: false, reason: 'Submit/Complete Delivery action is not available' };
		}

		await submitButton.click();
		if (await this.confirmButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
			await this.confirmButton.click();
		}
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		const poText = await this.page.getByText(/\bPO-[A-Z0-9-]+\b/i).first().textContent().catch(() => null);
		const poNumber = poText?.match(/\bPO-[A-Z0-9-]+\b/i)?.[0];
		return { submitted: true, poNumber };
	}

	async searchAndSelectWillCallItem(term: string): Promise<void> {
		await this.searchAndSelectAddItem(term);
	}

	private unitCostField(): Locator {
		return this.page.getByLabel(/unit cost/i).or(
			this.page.getByText(/^unit cost$/i).locator('xpath=following::input[1]'),
		).first();
	}

	async verifyUnitCostReadOnlyAndPopulated(): Promise<void> {
		const field = this.unitCostField();
		await expect(field).not.toBeEditable();
		const value = await field.inputValue().catch(async () => (await field.textContent()) ?? '');
		expect(value.trim(), 'Unit Cost should be populated from the pricing feed').not.toBe('');
		expect(value.trim()).not.toMatch(/^\$?0(\.00)?$/);
	}

	async verifyUnitCostErrorStateForUnavailablePricing(): Promise<void> {
		const field = this.unitCostField();
		const errorIndicator = this.page.locator('[aria-invalid="true"], [class*="error" i]').filter({ has: field }).or(
			field.locator('xpath=ancestor::*[contains(@class, "error")][1]'),
		).or(this.page.getByText(/price unavailable|no pricing|unable to retrieve price/i));
		await expect(errorIndicator.first()).toBeVisible({ timeout: 10_000 });
		const value = (await field.inputValue().catch(() => '')).trim();
		expect(value).not.toBe('0');
		expect(value).not.toBe('$0.00');
	}

	async getUnitCostValue(): Promise<string> {
		const field = this.unitCostField();
		return (await field.inputValue().catch(async () => (await field.textContent()) ?? '')).trim();
	}

	// ── Possible Duplicate Delivery popup (RCSP-168_07/08) ──

	private duplicateDeliveryDialog(): Locator {
		return this.page.getByRole('dialog').filter({ hasText: /possible duplicate delivery/i }).or(
			this.page.getByText(/possible duplicate delivery/i).locator('xpath=ancestor::*[self::div][1]'),
		).first();
	}

	async handleDuplicateDeliveryPopupIfPresent(): Promise<{ shown: boolean; details?: string }> {
		const dialog = this.duplicateDeliveryDialog();
		if (!(await dialog.isVisible({ timeout: 8_000 }).catch(() => false))) {
			return { shown: false };
		}
		const details = await dialog.innerText().catch(() => '');
		return { shown: true, details };
	}

	async verifyDuplicatePopupActionsVisible(): Promise<void> {
		const dialog = this.duplicateDeliveryDialog();
		await expect(dialog.getByRole('button', { name: /^cancel$/i })).toBeVisible();
		await expect(dialog.getByRole('button', { name: /create anyway/i })).toBeVisible();
	}

	async clickCreateAnyway(): Promise<void> {
		const dialog = this.duplicateDeliveryDialog();
		await dialog.getByRole('button', { name: /create anyway/i }).click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	async cancelDuplicatePopup(): Promise<void> {
		const dialog = this.duplicateDeliveryDialog();
		await dialog.getByRole('button', { name: /^cancel$/i }).click();
	}

	/** Selects a Will Call item and dismisses the duplicate-delivery popup via Create Anyway when shown. */
	async selectItemHandlingDuplicatePopup(term: string): Promise<void> {
		await this.searchAndSelectAddItem(term).catch(async () => {
			const { shown } = await this.handleDuplicateDeliveryPopupIfPresent();
			if (shown) {
				await this.clickCreateAnyway();
				await this.searchAndSelectAddItem(term);
			} else {
				throw new Error(`Unable to select item: ${term}`);
			}
		});

		const { shown } = await this.handleDuplicateDeliveryPopupIfPresent();
		if (shown) await this.clickCreateAnyway();
	}

	// ── Item Total / Total Value (RCSP-168_05) ──────────────

	private itemTotalCell(itemName: string): Locator {
		return this.lineItemRow(itemName).getByRole('cell').filter({ hasText: /^\$?\d/ }).last();
	}

	async getItemTotalValue(itemName: string): Promise<string> {
		return (await this.itemTotalCell(itemName).innerText().catch(() => '')).trim();
	}

	async verifyItemTotalMatchesQtyTimesUnitCost(itemName: string, receivedQty: number): Promise<void> {
		const unitCostText = await this.getUnitCostValue();
		const unitCost = Number.parseFloat(unitCostText.replace(/[^0-9.]/g, ''));
		expect(Number.isNaN(unitCost), 'Unit Cost should be a parseable numeric value').toBe(false);

		const itemTotalText = await this.getItemTotalValue(itemName);
		const itemTotal = Number.parseFloat(itemTotalText.replace(/[^0-9.]/g, ''));
		expect(Number.isNaN(itemTotal), 'Item Total should be a parseable numeric value').toBe(false);

		expect(itemTotal).toBeCloseTo(receivedQty * unitCost, 2);
	}

	// ── Batch Number absence (RCSP-168_09) ──────────────────

	async verifyBatchNumberFieldAbsent(): Promise<void> {
		await expect(this.page.getByLabel(/batch number/i)).toHaveCount(0);
		await expect(this.page.getByText(/^batch number$/i)).toHaveCount(0);
	}

	// ── Export / Print (RCSP-24_07/08) ──────────────────────

	async verifyExportOrPrintAvailable(): Promise<void> {
		const exportVisible = await this.exportButton.isVisible().catch(() => false);
		const printVisible = await this.printButton.isVisible().catch(() => false);
		expect(exportVisible || printVisible, 'Expected Export or Print action to be available').toBe(true);
	}

	async captureExportedDocumentText(): Promise<string | undefined> {
		const trigger = (await this.exportButton.isVisible().catch(() => false)) ? this.exportButton : this.printButton;
		if (!(await trigger.isVisible().catch(() => false))) return undefined;

		const [popup] = await Promise.all([
			this.page.waitForEvent('popup', { timeout: 10_000 }).catch(() => null),
			trigger.click(),
		]);

		if (popup) {
			await popup.waitForLoadState('domcontentloaded').catch(() => undefined);
			const text = await popup.locator('body').innerText().catch(() => '');
			await popup.close().catch(() => undefined);
			return text;
		}

		const previewDialog = this.page.getByRole('dialog').first();
		if (await previewDialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
			const text = await previewDialog.innerText().catch(() => '');
			await this.page.keyboard.press('Escape').catch(() => undefined);
			return text;
		}

		return undefined;
	}

	verifyDocumentContainsRequiredFields(documentText: string): void {
		for (const pattern of [/vendor/i, /store/i, /po/i, /item/i, /received qty|receipt qty/i, /uom|unit of measure/i, /unit price/i, /total/i]) {
			expect(pattern.test(documentText), `Exported document should contain a match for ${pattern}`).toBe(true);
		}
	}

	// ── Immutability after confirmation (RCSP-24_08) ────────

	async verifyReceivingDetailImmutableAfterConfirmation(): Promise<void> {
		await this.verifyReceivedFieldsPopulatedAndReadOnly();
		await expect(this.addItemButton).toHaveCount(0);
		await expect(this.completeDeliveryButton).toHaveCount(0);
	}
}
