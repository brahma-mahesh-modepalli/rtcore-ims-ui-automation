import { type Locator, type Page, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

type HotShotOrderSubmitResult = {
	submitted: boolean;
	orderNumber?: string;
	reason?: string;
};

export class HotShotOrderPage {
	readonly pageTitle: Locator;
	readonly pageDescription: Locator;
	readonly vendorTriggerButton: Locator;
	readonly requiredDateInput: Locator;
	readonly notesInput: Locator;
	readonly autoSuggestItemsButton: Locator;
	readonly addLineButton: Locator;
	readonly clearButton: Locator;
	readonly saveAsDraftButton: Locator;
	readonly createAndSubmitButton: Locator;
	readonly lineItemVendorDisabledButton: Locator;
	readonly lineItemQtyInput: Locator;
	readonly alertDialog: Locator;

	constructor(private readonly page: Page) {
		this.pageTitle = page.getByRole('heading', { name: 'Hot Shot Order' });
		this.pageDescription = page.getByText(
			'Create a new hot shot order for vendor supplies',
			{ exact: true },
		);
		this.vendorTriggerButton = page
			.locator('main')
			.getByText('Vendor *', { exact: true })
			.first()
			.locator('xpath=following::button[1]');
		this.requiredDateInput = page.locator('main').getByRole('textbox').first();
		this.notesInput = page.getByPlaceholder('Optional notes...');
		this.autoSuggestItemsButton = page.getByRole('button', {
			name: 'Auto-Suggest Items',
			exact: true,
		});
		this.addLineButton = page.getByRole('button', {
			name: 'Add Line',
			exact: true,
		});
		this.clearButton = page.getByRole('button', { name: 'Clear', exact: true });
		this.saveAsDraftButton = page.getByRole('button', {
			name: 'Save as Draft',
			exact: true,
		});
		this.createAndSubmitButton = page.getByRole('button', {
			name: 'Create & Submit',
			exact: true,
		});
		this.lineItemVendorDisabledButton = page.getByRole('button', {
			name: 'Select a vendor first',
			exact: true,
		});
		this.lineItemQtyInput = page.getByRole('spinbutton').first();
		this.alertDialog = page.getByRole('alertdialog');
	}

	private getDefaultRequiredDate(daysAhead = 1): string {
		const date = new Date();
		date.setDate(date.getDate() + daysAhead);
		return date.toISOString().split('T')[0];
	}

	private getVendorOption(option: string): Locator {
		return this.page.getByRole('button', { name: option, exact: true });
	}

	private getInitialLineItemButton(): Locator {
		return this.page.locator('main table tbody tr').first().getByRole('button').first();
	}

	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private extractOrderNumber(value?: string | null): string | undefined {
		if (!value) {
			return undefined;
		}

		return value.match(/\bPO-[A-Z0-9-]+\b/i)?.[0];
	}

	private async waitForAutoSuggestToSettle(): Promise<void> {
		await expect
			.poll(
				async () => {
					const buttonText = (await this.autoSuggestItemsButton.textContent().catch(() => '')) ?? '';
					return /loading/i.test(buttonText);
				},
				{
					timeout: 10_000,
					message: 'Waiting for Hot Shot auto-suggest to finish loading.',
				},
			)
			.toBe(false);
	}

	private async waitForOrderFeedback(messagePattern: RegExp): Promise<boolean> {
		return this.page
			.getByText(messagePattern)
			.first()
			.waitFor({ state: 'visible', timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
	}

	private async resolveOrderNumberFromCurrentContext(): Promise<string | undefined> {
		const urlOrderNumber = this.extractOrderNumber(this.page.url());
		if (urlOrderNumber) {
			return urlOrderNumber;
		}

		const mainText = (await this.page.locator('main').textContent().catch(() => '')) ?? '';
		return this.extractOrderNumber(mainText);
	}

	private async tryAutoSuggestItems(): Promise<string> {
		const currentLineItemText =
			((await this.getInitialLineItemButton().textContent().catch(() => '')) ?? '').trim();
		const autoSuggestText = (await this.autoSuggestItemsButton.textContent().catch(() => '')) ?? '';
		const autoSuggestLoading = /loading/i.test(autoSuggestText);
		const autoSuggestEnabled = await this.autoSuggestItemsButton.isEnabled().catch(() => false);

		if (!autoSuggestLoading && !autoSuggestEnabled) {
			return currentLineItemText;
		}

		await this.dismissAlertDialogIfPresent();

		if (autoSuggestEnabled) {
			await this.autoSuggestItemsButton.click().catch(async () => {
				await this.dismissAlertDialogIfPresent();
			});
		}

		await this.waitForAutoSuggestToSettle().catch(() => undefined);
		await this.dismissAlertDialogIfPresent();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
		return ((await this.getInitialLineItemButton().textContent().catch(() => '')) ?? '').trim();
	}

	private async ensureAtLeastOneLineItemSelected(): Promise<boolean> {
		const lineItemButton = this.getInitialLineItemButton();
		let lineItemText = ((await lineItemButton.textContent().catch(() => '')) ?? '').trim();

		if (/no items in vendor guide/i.test(lineItemText)) {
			lineItemText = await this.tryAutoSuggestItems();
		}

		if (/no items in vendor guide|select a vendor first/i.test(lineItemText)) {
			return false;
		}

		if (/select item/i.test(lineItemText)) {
			await lineItemButton.click();
			const optionButtons = this.page.locator('body > div').last().getByRole('button');
			const optionCount = await optionButtons.count();

			for (let index = 0; index < optionCount; index += 1) {
				const option = optionButtons.nth(index);
				const optionText = (await option.textContent().catch(() => ''))?.trim() ?? '';

				if (!optionText || /select item/i.test(optionText)) {
					continue;
				}

				await option.click();
				break;
			}
		}

		if (await this.lineItemQtyInput.isVisible().catch(() => false)) {
			const currentQty = ((await this.lineItemQtyInput.inputValue().catch(() => '')) ?? '').trim();
			if (!currentQty || currentQty === '0') {
				await this.lineItemQtyInput.fill('1');
			}
		}

		return true;
	}

	/**
	 * Wait for the Hot Shot Order page.
	 * Verifies URL and page heading visibility.
	 */
	async waitForHotShotOrderPageToLoad(): Promise<void> {
		await expect(this.page).toHaveURL(/\/orders\/hotshot$/);
		await expect(this.pageTitle).toBeVisible();
	}

	/**
	 * Validate Hot Shot Order page controls.
	 * Verifies dropdown, text fields, and action button states.
	 */
	async verifyHotShotOrderPageLoaded(): Promise<void> {
		await this.waitForHotShotOrderPageToLoad();
		await expect(this.pageDescription).toBeVisible();
		await expect(this.vendorTriggerButton).toBeVisible();
		await expect(this.vendorTriggerButton).toBeEnabled();
		await expect(this.requiredDateInput).toBeVisible();
		await expect(this.requiredDateInput).toBeEditable();
		await expect(this.notesInput).toBeVisible();
		await expect(this.autoSuggestItemsButton).toBeVisible();
		await expect(this.autoSuggestItemsButton).toBeDisabled();
		await expect(this.addLineButton).toBeVisible();
		await expect(this.lineItemVendorDisabledButton).toBeDisabled();
		await expect(this.lineItemQtyInput).toBeVisible();
		await expect(this.clearButton).toBeVisible();
		await expect(this.saveAsDraftButton).toBeVisible();
		await expect(this.createAndSubmitButton).toBeVisible();

		log('✓ Verified: Hot Shot Order page controls are displayed');
	}

	/**
	 * Open the vendor dropdown.
	 * Verifies vendor trigger is enabled before clicking.
	 */
	async openVendorDropdown(): Promise<void> {
		await this.dismissAlertDialogIfPresent();
		await expect(this.vendorTriggerButton).toBeEnabled();

		try {
			await this.vendorTriggerButton.click();
		} catch (error) {
			const alertReason = await this.dismissAlertDialogIfPresent();
			if (alertReason) {
				throw new Error(`Unable to reopen the Hot Shot vendor dropdown after a blocking alert: ${alertReason}`);
			}

			throw error;
		}

		log('✓ Opened Hot Shot vendor dropdown');
	}

	/**
	 * Read currently visible vendor options from the vendor dropdown.
	 * Returns runtime option texts for data-driven validations.
	 */
	async getVendorOptions(): Promise<string[]> {
		await this.openVendorDropdown();

		const overlayButtons = this.page.locator('body > div').last().getByRole('button');
		const optionCount = await overlayButtons.count();
		const options: string[] = [];

		for (let index = 0; index < optionCount; index += 1) {
			const text = (await overlayButtons.nth(index).textContent())?.trim();

			if (!text || text === 'Select vendor') {
				continue;
			}

			options.push(text);
		}

		await this.page.keyboard.press('Escape');

		return [...new Set(options)];
	}

	/**
	 * Select a vendor from the vendor dropdown.
	 * @param vendorName Exact vendor option text to choose.
	 */
	async selectVendor(vendorName: string): Promise<void> {
		await this.openVendorDropdown();
		await this.getVendorOption(vendorName).click();

		const selectedVendorButton = this.page
			.locator('main')
			.getByRole('button', { name: new RegExp(this.escapeRegExp(vendorName), 'i') })
			.first();
		await expect(selectedVendorButton).toBeVisible();

		log(`✓ Selected Hot Shot vendor: ${vendorName}`);
	}

	/**
	 * Fill the required date field.
	 * @param date Date value in the expected UI format.
	 */
	async fillRequiredDate(date: string): Promise<void> {
		await expect(this.requiredDateInput).toBeVisible();
		await expect(this.requiredDateInput).toBeEditable();

		await this.requiredDateInput.fill(date).catch(async () => {
			await this.requiredDateInput.click({ force: true }).catch(() => undefined);
			await this.requiredDateInput.evaluate((element, value) => {
				const input = element as {
					value: string;
					dispatchEvent: (event: unknown) => boolean;
				};
				const eventConstructor = (globalThis as unknown as {
					Event: new (type: string, init?: { bubbles?: boolean }) => unknown;
				}).Event;
				input.value = value as string;
				input.dispatchEvent(new eventConstructor('input', { bubbles: true }));
				input.dispatchEvent(new eventConstructor('change', { bubbles: true }));
			}, date);
		});
		await expect(this.requiredDateInput).toHaveValue(date);

		log(`✓ Filled Hot Shot required date: ${date}`);
	}

	/**
	 * Fill the optional notes field.
	 * @param notes Notes text to set.
	 */
	async fillNotes(notes: string, assertExact = true): Promise<void> {
		await this.notesInput.fill(notes);
		if (assertExact) {
			await expect(this.notesInput).toHaveValue(notes);
		}

		log('✓ Filled Hot Shot notes');
	}

	async getNotesValue(): Promise<string> {
		await expect(this.notesInput).toBeVisible();
		return (await this.notesInput.inputValue().catch(async () => (await this.notesInput.textContent()) ?? '')) ?? '';
	}

	async ensureRequiredDate(): Promise<string> {
		const currentValue = (await this.requiredDateInput.inputValue().catch(() => '')).trim();

		if (currentValue) {
			return currentValue;
		}

		const defaultDate = this.getDefaultRequiredDate();
		await this.fillRequiredDate(defaultDate);
		return defaultDate;
	}

	async dismissAlertDialogIfPresent(): Promise<string | undefined> {
		if (!(await this.alertDialog.isVisible().catch(() => false))) {
			return undefined;
		}

		const alertText = (await this.alertDialog.textContent())?.trim() ?? 'Blocking alert dialog shown.';
		const dismissButtonPatterns = [/^ok$/i, /^close$/i, /^dismiss$/i, /^cancel$/i, /^continue$/i];

		for (const pattern of dismissButtonPatterns) {
			const dismissButton = this.alertDialog.getByRole('button', { name: pattern }).first();
			if (await dismissButton.isVisible().catch(() => false)) {
				await dismissButton.click();
				await this.alertDialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
				return alertText;
			}
		}

		await this.page.keyboard.press('Escape').catch(() => undefined);
		await this.alertDialog.waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => undefined);

		return alertText;
	}

	async submitCurrentOrder(): Promise<HotShotOrderSubmitResult> {
		await this.ensureRequiredDate();
		await expect(this.createAndSubmitButton).toBeEnabled();
		await this.createAndSubmitButton.click().catch(async () => {
			await this.dismissAlertDialogIfPresent();
			await this.createAndSubmitButton.click({ force: true });
		});
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		const alertReason = await this.dismissAlertDialogIfPresent();
		if (alertReason) {
			return { submitted: false, reason: alertReason };
		}

		const stillOnHotShotPage = /\/orders\/hotshot$/.test(this.page.url());
		const receivedSuccessFeedback = await this.waitForOrderFeedback(
			/purchase order (created|submitted|saved)/i,
		);
		if (stillOnHotShotPage && !receivedSuccessFeedback) {
			return {
				submitted: false,
				reason: 'Hot Shot submission did not show success feedback or leave the Hot Shot Order page.',
			};
		}

		return {
			submitted: true,
			orderNumber: await this.resolveOrderNumberFromCurrentContext(),
		};
	}

	async createAndSubmitHotShotOrder(
		vendors: string[],
		notes: string,
	): Promise<HotShotOrderSubmitResult> {
		const availableVendors = await this.getVendorOptions();
		const matchingVendors = vendors.filter((vendor) => availableVendors.includes(vendor));

		if (!matchingVendors.length) {
			return {
				submitted: false,
				reason: 'No matching vendor available in Hot Shot runtime dropdown options.',
			};
		}

		for (const candidateVendor of matchingVendors) {
			await this.selectVendor(candidateVendor);

			if (!(await this.ensureAtLeastOneLineItemSelected())) {
				await this.dismissAlertDialogIfPresent();
				continue;
			}

			await this.fillNotes(notes);
			const submission = await this.submitCurrentOrder();
			if (submission.submitted) {
				return submission;
			}
		}

		return {
			submitted: false,
			reason: 'No matching Hot Shot vendor produced a submittable order context in the current environment.',
		};
	}

	/**
	 * Validate that the Notes field is visible and editable.
	 */
	async assertNotesVisibleAndEditable(): Promise<void> {
		await expect(this.notesInput).toBeVisible();
		await expect(this.notesInput).toBeEditable();
	}

	/**
	 * Validate the exact Notes value shown in the current Hot Shot context.
	 * @param notes Expected notes value.
	 */
	async assertNotesValue(notes: string): Promise<void> {
		const actualValue = (await this.getNotesValue()).replace(/\r\n/g, '\n');
		expect(actualValue).toBe(notes.replace(/\r\n/g, '\n'));
	}
}
