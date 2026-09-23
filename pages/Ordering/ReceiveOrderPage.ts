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
	readonly ordersTable: Locator;
	readonly completeDeliveryButton: Locator;
	readonly confirmButton: Locator;

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
		this.ordersTable = page.getByRole('table').first();
		this.completeDeliveryButton = page.getByRole('button', { name: /complete delivery/i });
		this.confirmButton = page
			.getByRole('button', { name: /^(confirm|yes)$/i })
			.first();
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
}
