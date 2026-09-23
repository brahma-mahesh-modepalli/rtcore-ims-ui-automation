/**
 * FlowersTesterPage – Page Object
 * ================================
 * Locators and actions for the external Flowers vendor ASN test tool
 * used to confirm a transmitted PO (RCSP-24 receiving test-data setup).
 */

import { type Page, expect } from '@playwright/test';
import { log } from '../../utils/helpers';
import { ExternalSystemCredentials } from '../../config/externalCredentials';

export class FlowersTesterPage {
	constructor(private readonly page: Page) {}

	async open(): Promise<boolean> {
		const { url } = ExternalSystemCredentials.flowersTester;
		log(`Launching Flowers Tester: ${url}`);
		const response = await this.page
			.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
			.catch(() => null);
		return Boolean(response);
	}

	async confirmPurchaseOrder(poNumber: string): Promise<{ confirmed: boolean; reason?: string }> {
		const poId = poNumber.replace(/^PO-/i, '');
		const poIdInput = this.page
			.getByLabel(/po\s*id/i)
			.or(this.page.getByPlaceholder(/po\s*id/i))
			.first();

		if (!(await poIdInput.isVisible({ timeout: 10_000 }).catch(() => false))) {
			return { confirmed: false, reason: 'PO ID field is not available on Flowers Tester' };
		}

		await poIdInput.fill(poId);

		const modeDropdown = this.page.getByLabel(/mode/i).or(this.page.getByRole('combobox', { name: /mode/i })).first();
		if (await modeDropdown.isVisible().catch(() => false)) {
			await modeDropdown.selectOption({ label: 'Confirm' }).catch(async () => {
				await modeDropdown.click();
				await this.page.getByRole('option', { name: /^confirm$/i }).click();
			});
		}

		const runButton = this.page.getByRole('button', { name: /^run$/i }).first();
		if (!(await runButton.isVisible().catch(() => false))) {
			return { confirmed: false, reason: 'Run button is not available on Flowers Tester' };
		}

		await runButton.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		const outputTextarea = this.page.getByRole('textbox').last();
		const done = await expect
			.poll(async () => (await outputTextarea.inputValue().catch(() => '')).includes('Done'), {
				timeout: 20_000,
				message: 'Waiting for Flowers Tester output to contain "Done."',
			})
			.toBe(true)
			.then(() => true)
			.catch(() => false);

		return done ? { confirmed: true } : { confirmed: false, reason: 'Flowers Tester output did not report Done.' };
	}
}
