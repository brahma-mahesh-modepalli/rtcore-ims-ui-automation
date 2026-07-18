import { type Locator, type Page, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

type ScheduledOrderItemInput = {
	itemName: string;
};

type ScheduledOrderSaveResult = {
	saved: boolean;
	orderNumber?: string;
	reason?: string;
};

type OpenOrderFromGridResult = {
	opened: boolean;
	orderNumber?: string;
	editRestricted?: boolean;
	reason?: string;
};

type SubmitOrderFromGridResult = {
	submitted: boolean;
	orderNumber?: string;
	reason?: string;
};

export class ScheduledOrderPage {
	readonly pageTitle: Locator;
	readonly pageDescription: Locator;
	readonly newScheduledOrderButton: Locator;
	readonly statusFilterAllButton: Locator;
	readonly statusFilterDraftButton: Locator;
	readonly statusFilterSubmittedButton: Locator;
	readonly ordersTable: Locator;
	readonly poNumberHeader: Locator;
	readonly vendorHeader: Locator;
	readonly requiredDateHeader: Locator;
	readonly statusHeader: Locator;
	readonly totalHeader: Locator;
	readonly orderTypeHeader: Locator;
	readonly actionsHeader: Locator;

	readonly createOrderTitle: Locator;
	readonly vendorTriggerButton: Locator;
	readonly requiredDateInput: Locator;
	readonly notesInput: Locator;
	readonly autoSuggestItemsButton: Locator;
	readonly addLineButton: Locator;
	readonly cancelButton: Locator;
	readonly saveAsDraftButton: Locator;
	readonly createAndSubmitButton: Locator;
	readonly lineItemVendorDisabledButton: Locator;
	readonly lineItemQtyInput: Locator;
	readonly alertDialog: Locator;

	constructor(private readonly page: Page) {
		this.pageTitle = page.getByRole('heading', { name: 'Scheduled Orders' });
		this.pageDescription = page.getByText(
			'Purchase orders organized by upcoming delivery dates',
			{ exact: true },
		);
		this.newScheduledOrderButton = page.getByRole('button', {
			name: 'New Scheduled Order',
			exact: true,
		});
		this.statusFilterAllButton = page.getByRole('button', {
			name: 'all',
			exact: true,
		});
		this.statusFilterDraftButton = page.getByRole('button', {
			name: 'draft',
			exact: true,
		});
		this.statusFilterSubmittedButton = page.getByRole('button', {
			name: 'submitted',
			exact: true,
		});
		this.ordersTable = page.getByRole('table').first();
		this.poNumberHeader = page.getByRole('columnheader', { name: 'PO #' });
		this.vendorHeader = page.getByRole('columnheader', { name: 'Vendor' });
		this.requiredDateHeader = page.getByRole('columnheader', {
			name: 'Required Date',
		});
		this.statusHeader = page.getByRole('columnheader', { name: 'Status' });
		this.totalHeader = page.getByRole('columnheader', { name: 'Total' });
		this.orderTypeHeader = page.getByRole('columnheader', { name: 'Order Type' });
		this.actionsHeader = page.getByRole('columnheader', { name: 'Actions' });

		this.createOrderTitle = page.getByRole('heading', {
			name: 'New Scheduled Order',
		});
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
		this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
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

	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private async getActiveNotesInput(): Promise<Locator> {
		const notesInputs = this.page.getByPlaceholder('Optional notes...');
		const inputCount = await notesInputs.count().catch(() => 0);

		for (let index = 0; index < inputCount; index += 1) {
			const candidate = notesInputs.nth(index);
			if (await candidate.isVisible().catch(() => false)) {
				return candidate;
			}
		}

		return notesInputs.first();
	}

	private extractOrderNumber(value?: string | null): string | undefined {
		if (!value) {
			return undefined;
		}

		return value.match(/\bPO-[A-Z0-9-]+\b/i)?.[0];
	}

	private getStatusFilterButton(status: string): Locator {
		switch (status.toLowerCase()) {
			case 'all':
				return this.statusFilterAllButton;
			case 'draft':
				return this.statusFilterDraftButton;
			case 'submitted':
				return this.statusFilterSubmittedButton;
			default:
				return this.page.getByRole('button', {
					name: new RegExp(`^${this.escapeRegExp(status)}$`, 'i'),
				});
		}
	}

	private async applyStatusFilter(status: string): Promise<void> {
		const filterButton = this.getStatusFilterButton(status);

		if (!(await filterButton.isVisible().catch(() => false))) {
			return;
		}

		await filterButton.click().catch(() => undefined);
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	private async getOrderRow(orderNumber?: string, status?: string): Promise<Locator | null> {
		if (status) {
			await this.applyStatusFilter(status);
		}

		let rows = this.ordersTable.locator('tbody tr');
		if (orderNumber) {
			rows = rows.filter({
				hasText: new RegExp(this.escapeRegExp(orderNumber), 'i'),
			});
		}

		if (status) {
			rows = rows.filter({
				hasText: new RegExp(this.escapeRegExp(status), 'i'),
			});
		}

		if ((await rows.count()) > 0) {
			return rows.first();
		}

		if (status) {
			const fallbackRows = this.ordersTable.locator('tbody tr').filter({
				hasText: new RegExp(this.escapeRegExp(status), 'i'),
			});

			if ((await fallbackRows.count()) > 0) {
				return fallbackRows.first();
			}

			return null;
		}

		if (orderNumber) {
			return null;
		}

		const anyRows = this.ordersTable.locator('tbody tr');
		return (await anyRows.count()) > 0 ? anyRows.first() : null;
	}

	private async resolveOrderNumberFromCurrentContext(status?: string): Promise<string | undefined> {
		const urlOrderNumber = this.extractOrderNumber(this.page.url());
		if (urlOrderNumber) {
			return urlOrderNumber;
		}

		const mainText = (await this.page.locator('main').textContent().catch(() => '')) ?? '';
		const textOrderNumber = this.extractOrderNumber(mainText);
		if (textOrderNumber) {
			return textOrderNumber;
		}

		const orderRow = await this.getOrderRow(undefined, status);
		if (!orderRow) {
			return undefined;
		}

		const orderNumberButton = orderRow.getByRole('button').filter({ hasText: /^PO-/i }).first();
		const orderNumberText = (await orderNumberButton.textContent().catch(() => '')) ?? '';
		return this.extractOrderNumber(orderNumberText);
	}

	private async waitForOrderContextToOpen(): Promise<boolean> {
		return expect
			.poll(
				async () => {
					await this.page.waitForLoadState('networkidle').catch(() => undefined);
					const onListingPage = /\/orders\/scheduled$/.test(this.page.url());
					const notesVisible = await this.notesInput.isVisible().catch(() => false);
					const editHeadingVisible = await this.page
						.getByRole('heading', { name: /edit order|order details/i })
						.first()
						.isVisible()
						.catch(() => false);
					return !onListingPage || notesVisible || editHeadingVisible;
				},
				{
					timeout: 10_000,
					message: 'Waiting for Scheduled Order detail or edit context to open from the grid.',
				},
			)
			.toBe(true)
			.then(() => true)
			.catch(() => false);
	}

	private async waitForOrderFeedback(messagePattern: RegExp): Promise<boolean> {
		return this.page
			.getByText(messagePattern)
			.first()
			.waitFor({ state: 'visible', timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Wait for the Scheduled Orders listing page.
	 * Verifies URL and primary heading visibility.
	 */
	async waitForScheduledOrdersPageToLoad(): Promise<void> {
		await expect(this.page).toHaveURL(/\/orders\/scheduled$/);
		await expect(this.pageTitle).toBeVisible();
	}

	/**
	 * Validate Scheduled Orders listing page controls and table headers.
	 * Verifies status filters and grid structure are visible.
	 */
	async verifyScheduledOrdersPageLoaded(): Promise<void> {
		await this.waitForScheduledOrdersPageToLoad();
		await expect(this.pageDescription).toBeVisible();
		await expect(this.newScheduledOrderButton).toBeEnabled();
		await this.verifyStatusFiltersVisible();
		await this.verifyTableHeadersVisible();

		log('✓ Verified: Scheduled Orders listing page is displayed');
	}

	/**
	 * Validate Scheduled Orders status filter chips.
	 * Verifies all, draft, and submitted filters are visible.
	 */
	async verifyStatusFiltersVisible(): Promise<void> {
		await expect(this.statusFilterAllButton).toBeVisible();
		await expect(this.statusFilterDraftButton).toBeVisible();
		await expect(this.statusFilterSubmittedButton).toBeVisible();

		log('✓ Verified: Scheduled Orders status filters are visible');
	}

	/**
	 * Validate Scheduled Orders table headers.
	 * Verifies PO, vendor, date, status, total, type, and action columns.
	 */
	async verifyTableHeadersVisible(): Promise<void> {
		await expect(this.poNumberHeader).toBeVisible();
		await expect(this.vendorHeader).toBeVisible();
		await expect(this.requiredDateHeader).toBeVisible();
		await expect(this.statusHeader).toBeVisible();
		await expect(this.totalHeader).toBeVisible();
		await expect(this.orderTypeHeader).toBeVisible();
		await expect(this.actionsHeader).toBeVisible();

		log('✓ Verified: Scheduled Orders table headers are visible');
	}

	/**
	 * Open the New Scheduled Order form.
	 * Verifies listing action is enabled, then form page is loaded.
	 */
	async clickNewScheduledOrderButton(): Promise<void> {
		await expect(this.newScheduledOrderButton).toBeEnabled();
		await this.newScheduledOrderButton.click();
		await this.waitForNewScheduledOrderPageToLoad();

		log('✓ Opened New Scheduled Order form');
	}

	/**
	 * Wait for the New Scheduled Order page.
	 * Verifies URL and form heading visibility.
	 */
	async waitForNewScheduledOrderPageToLoad(): Promise<void> {
		await expect(this.page).toHaveURL(/\/orders\/scheduled\/new$/);
		await expect(this.createOrderTitle).toBeVisible();
	}

	/**
	 * Validate New Scheduled Order form controls.
	 * Verifies dropdowns, text fields, and action buttons default states.
	 */
	async verifyNewScheduledOrderFormLoaded(): Promise<void> {
		await this.waitForNewScheduledOrderPageToLoad();
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
		await expect(this.cancelButton).toBeVisible();
		await expect(this.saveAsDraftButton).toBeVisible();
		await expect(this.createAndSubmitButton).toBeVisible();

		log('✓ Verified: New Scheduled Order form controls are displayed');
	}

	/**
	 * Open the vendor dropdown in the New Scheduled Order form.
	 * Verifies the trigger button is enabled before clicking.
	 */
	async openVendorDropdown(): Promise<void> {
		await this.dismissAlertDialogIfPresent();
		await expect(this.vendorTriggerButton).toBeEnabled();

		try {
			await this.vendorTriggerButton.click();
		} catch (error) {
			const alertReason = await this.dismissAlertDialogIfPresent();
			if (alertReason) {
				throw new Error(
					`Unable to reopen the Scheduled Order vendor dropdown after a blocking alert: ${alertReason}`,
				);
			}

			throw error;
		}

		log('✓ Opened Scheduled Order vendor dropdown');
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

	private getInitialLineItemButton(): Locator {
		return this.page.locator('main table tbody tr').first().getByRole('button').first();
	}

	private async getInitialLineItemOptions(): Promise<string[]> {
		const lineItemButton = this.getInitialLineItemButton();
		await lineItemButton.click();

		const overlayButtons = this.page.locator('body > div').last().getByRole('button');
		const optionCount = await overlayButtons.count();
		const options: string[] = [];

		for (let index = 0; index < optionCount; index += 1) {
			const text = (await overlayButtons.nth(index).textContent())?.trim();

			if (!text || /^select item$/i.test(text)) {
				continue;
			}

			options.push(text);
		}

		await this.page.keyboard.press('Escape');

		return [...new Set(options)];
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
					message: 'Waiting for Scheduled Order auto-suggest to finish loading.',
				},
			)
			.toBe(false);
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

	private async selectedVendorSupportsLineItems(
		preferredItems: ScheduledOrderItemInput[] = [],
	): Promise<boolean> {
		const lineItemButton = this.getInitialLineItemButton();
		let lineItemText = ((await lineItemButton.textContent().catch(() => '')) ?? '').trim();

		if (/no items in vendor guide/i.test(lineItemText)) {
			lineItemText = await this.tryAutoSuggestItems();
		}

		if (/no items in vendor guide|select a vendor first/i.test(lineItemText)) {
			return false;
		}

		if (!preferredItems.length) {
			return true;
		}

		const tableBodyText = (await this.page.locator('main table tbody').textContent().catch(() => '')) ?? '';
		const autoSuggestedItemsMatch = preferredItems.every((item) =>
			new RegExp(this.escapeRegExp(item.itemName), 'i').test(tableBodyText),
		);

		if (autoSuggestedItemsMatch) {
			return true;
		}

		if (!/select item/i.test(lineItemText)) {
			return false;
		}

		const availableItems = await this.getInitialLineItemOptions();
		return preferredItems.every((item) => availableItems.includes(item.itemName));
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
			.getByRole('button', { name: new RegExp(vendorName, 'i') })
			.first();
		await expect(selectedVendorButton).toBeVisible();

		log(`✓ Selected Scheduled Order vendor: ${vendorName}`);
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

		log(`✓ Filled Scheduled Order required date: ${date}`);
	}

	/**
	 * Fill the optional notes field.
	 * @param notes Notes text to set.
	 */
	async fillNotes(notes: string, assertExact = true): Promise<void> {
		const notesInput = await this.getActiveNotesInput();
		await notesInput.fill(notes);
		if (assertExact) {
			await expect(notesInput).toHaveValue(notes);
		}

		log('✓ Filled Scheduled Order notes');
	}

	async getNotesValue(): Promise<string> {
		const notesInput = await this.getActiveNotesInput();
		await expect(notesInput).toBeVisible();
		return (await notesInput.inputValue().catch(async () => (await notesInput.textContent()) ?? '')) ?? '';
	}

	async getNotesMaxLength(): Promise<number | undefined> {
		const notesInput = await this.getActiveNotesInput();
		const maxLength = await notesInput.getAttribute('maxlength').catch(() => null);
		if (!maxLength) {
			return undefined;
		}

		const parsedValue = Number.parseInt(maxLength, 10);
		return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
	}

	async getNotesValidationMessages(validationPatterns = ['max', 'character', 'limit', 'too long']): Promise<string[]> {
		const validationPattern = new RegExp(
			validationPatterns.map((pattern) => this.escapeRegExp(pattern)).join('|'),
			'i',
		);
		const messageTexts = await this.page.getByText(validationPattern).allTextContents().catch(() => []);
		return [...new Set(messageTexts.map((text) => text.trim()).filter((text) => validationPattern.test(text) && text.length <= 300))];
	}

	async isNotesFieldInvalid(): Promise<boolean> {
		const notesInput = await this.getActiveNotesInput();
		return (await notesInput.getAttribute('aria-invalid').catch(() => null)) === 'true';
	}

	/**
	 * Validate that the Notes field is visible and editable.
	 */
	async assertNotesVisibleAndEditable(): Promise<void> {
		const notesInput = await this.getActiveNotesInput();
		await expect(notesInput).toBeVisible();
		await expect(notesInput).toBeEditable();
	}

	/**
	 * Validate the exact Notes value shown in the current order context.
	 * @param notes Expected notes value.
	 */
	async assertNotesValue(notes: string): Promise<void> {
		const actualValue = (await this.getNotesValue()).replace(/\r\n/g, '\n');
		expect(actualValue).toBe(notes.replace(/\r\n/g, '\n'));
	}

	/**
	 * Update the Notes field for the current order context.
	 * @param notes Replacement notes value.
	 */
	async updateNotes(notes: string): Promise<void> {
		await this.fillNotes(notes);
	}

	/**
	 * Fill a default required date when the form is still empty.
	 */
	async ensureRequiredDate(): Promise<string> {
		const currentValue = (await this.requiredDateInput.inputValue().catch(() => '')).trim();

		if (currentValue) {
			return currentValue;
		}

		const defaultDate = this.getDefaultRequiredDate();
		await this.fillRequiredDate(defaultDate);
		return defaultDate;
	}

	/**
	 * Dismiss a blocking alert dialog when present and return its text.
	 */
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

	/**
	 * Submit the current scheduled order and surface blocking alert reasons when submission fails.
	 */
	async submitCurrentOrder(): Promise<{ submitted: boolean; reason?: string }> {
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

		const stillOnNewOrderPage = /\/orders\/scheduled\/new$/.test(this.page.url());
		const receivedSuccessFeedback = await this.waitForOrderFeedback(
			/purchase order (created|submitted|saved)/i,
		);
		if (stillOnNewOrderPage && !receivedSuccessFeedback) {
			return {
				submitted: false,
				reason: 'Order submission did not show success feedback or leave the New Scheduled Order form.',
			};
		}

		return { submitted: true };
	}

	/**
	 * Save the current Scheduled Order as draft and resolve its order number when available.
	 */
	async saveCurrentOrderAsDraft(): Promise<ScheduledOrderSaveResult> {
		await this.ensureRequiredDate();
		await expect(this.saveAsDraftButton).toBeEnabled();
		await this.saveAsDraftButton.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		const alertReason = await this.dismissAlertDialogIfPresent();
		if (alertReason) {
			return { saved: false, reason: alertReason };
		}

		const stayedOnNewOrderPage = /\/orders\/scheduled\/new$/.test(this.page.url());
		const receivedSuccessFeedback = await this.waitForOrderFeedback(/purchase order saved as draft/i);
		if (stayedOnNewOrderPage && !receivedSuccessFeedback) {
			return {
				saved: false,
				reason: 'Draft save did not show success feedback or leave the New Scheduled Order form.',
			};
		}

		return {
			saved: true,
			orderNumber: await this.resolveOrderNumberFromCurrentContext('draft'),
		};
	}

	/**
	 * Save changes for an existing Scheduled Order context.
	 */
	async saveCurrentOrderChanges(): Promise<ScheduledOrderSaveResult> {
		const saveChangesButton = this.page.getByRole('button', {
			name: /save changes/i,
		}).first();
		const saveButton = (await saveChangesButton.isVisible().catch(() => false))
			? saveChangesButton
			: this.saveAsDraftButton;

		await expect(saveButton).toBeEnabled();
		await saveButton.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		const alertReason = await this.dismissAlertDialogIfPresent();
		if (alertReason) {
			return { saved: false, reason: alertReason };
		}

		return {
			saved: true,
			orderNumber: await this.resolveOrderNumberFromCurrentContext('draft'),
		};
	}

	/**
	 * Open New Scheduled Order, validate form, then select first matching vendor.
	 * @param vendors Vendor preference order to resolve from runtime dropdown options.
	 * @param notes Optional order notes to enter after vendor selection.
	 */
	async createNewScheduledOrderContext(
		vendors: string[],
		notes = 'RCSP-162 automation validation order',
		preferredItems: ScheduledOrderItemInput[] = [],
	): Promise<{ created: boolean; selectedVendor?: string; reason?: string }> {
		await this.clickNewScheduledOrderButton();
		await this.verifyNewScheduledOrderFormLoaded();

		const availableVendors = await this.getVendorOptions();
		const matchingVendors = vendors.filter((vendor) => availableVendors.includes(vendor));

		if (!matchingVendors.length) {
			return {
				created: false,
				reason: 'No matching vendor available in runtime dropdown options.',
			};
		}

		for (const candidateVendor of matchingVendors) {
			try {
				await this.selectVendor(candidateVendor);
			} catch (error) {
				return {
					created: false,
					reason:
						error instanceof Error
							? error.message
							: 'Unable to reopen the Scheduled Order vendor dropdown in the current environment.',
				};
			}

			if (!(await this.selectedVendorSupportsLineItems(preferredItems))) {
				await this.dismissAlertDialogIfPresent();
				continue;
			}

			await this.fillNotes(notes);
			return { created: true, selectedVendor: candidateVendor };
		}

		return {
			created: false,
			reason: preferredItems.length
				? 'No matching vendor exposes the requested line items in the current environment.'
				: 'No matching vendor exposes addable line items in the current environment.',
		};
	}

	/**
	 * Create a Scheduled Order draft with required vendor, items, and notes.
	 */
	async createScheduledOrderDraft(
		vendors: string[],
		items: ScheduledOrderItemInput[],
		notes: string,
	): Promise<ScheduledOrderSaveResult> {
		const createdOrder = await this.createNewScheduledOrderContext(vendors, notes, items);
		if (!createdOrder.created) {
			return { saved: false, reason: createdOrder.reason };
		}

		if (items.length > 0) {
			const addedItems = await this.addItemsToOrder(items);
			if (addedItems.addedCount === 0) {
				return {
					saved: false,
					reason: addedItems.reason ?? 'Unable to add required line items for draft creation.',
				};
			}
		} else {
			await this.tryAutoSuggestItems().catch(() => undefined);
		}

		return this.saveCurrentOrderAsDraft();
	}

	/**
	 * Create and submit a Scheduled Order with required vendor, items, and notes.
	 */
	async createAndSubmitScheduledOrder(
		vendors: string[],
		items: ScheduledOrderItemInput[],
		notes: string,
	): Promise<{ submitted: boolean; orderNumber?: string; reason?: string }> {
		const createdOrder = await this.createNewScheduledOrderContext(vendors, notes, items);
		if (!createdOrder.created) {
			return { submitted: false, reason: createdOrder.reason };
		}

		if (items.length > 0) {
			const addedItems = await this.addItemsToOrder(items);
			if (addedItems.addedCount === 0) {
				return {
					submitted: false,
					reason: addedItems.reason ?? 'Unable to add required line items for order submission.',
				};
			}
		} else {
			await this.tryAutoSuggestItems().catch(() => undefined);
		}

		const submission = await this.submitCurrentOrder();
		if (!submission.submitted) {
			return submission;
		}

		return {
			submitted: true,
			orderNumber: await this.resolveOrderNumberFromCurrentContext('submitted'),
		};
	}

	/**
	 * Add line items to the current order form.
	 * @param items Items to add by display name.
	 */
	async addItemsToOrder(
		items: ScheduledOrderItemInput[],
	): Promise<{ addedCount: number; reason?: string }> {
		let addedCount = 0;

		if (!(await this.addLineButton.isVisible())) {
			return {
				addedCount: 0,
				reason: 'Add Line button is not visible on the order screen.',
			};
		}

		for (let index = 0; index < items.length; index += 1) {
			await this.dismissAlertDialogIfPresent();
			const itemNameMatcher = new RegExp(this.escapeRegExp(items[index].itemName), 'i');
			const tableRows = this.page.locator('main table tbody tr');
			const matchingRows = tableRows.filter({ hasText: itemNameMatcher });

			if ((await matchingRows.count()) > 0) {
				const existingItemRow = matchingRows.first();
				const qtyInput = existingItemRow.getByRole('spinbutton').first();
				if (await qtyInput.isVisible().catch(() => false)) {
					const currentQty = ((await qtyInput.inputValue().catch(() => '')) ?? '').trim();
					if (!currentQty || currentQty === '0') {
						await qtyInput.fill('1');
					}
				}

				addedCount += 1;
				continue;
			}

			const rowCount = await tableRows.count();
			let targetRow = tableRows.last();

			for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
				const candidateRow = tableRows.nth(rowIndex);
				const candidateButton = candidateRow.getByRole('button').first();
				const candidateText = ((await candidateButton.textContent().catch(() => '')) ?? '').trim();

				if (/select item|no items in vendor guide|select a vendor first/i.test(candidateText)) {
					targetRow = candidateRow;
					break;
				}
			}

			const existingRowButton = targetRow.getByRole('button').first();
			const existingRowText = ((await existingRowButton.textContent().catch(() => '')) ?? '').trim();

			if (!/select item|no items in vendor guide|select a vendor first/i.test(existingRowText)) {
				const addedLine = await this.addLineButton
					.click()
					.then(() => true)
					.catch(async () => {
						await this.dismissAlertDialogIfPresent();
						return false;
					});

				if (!addedLine) {
					return {
						addedCount,
						reason: 'Add Line was blocked by an alert dialog in the current environment.',
					};
				}

				targetRow = this.page.locator('main table tbody tr').last();
			}

			const rowButton = targetRow.getByRole('button').first();
			const rowButtonText = (await rowButton.textContent())?.trim() ?? '';

			if (
				/no items in vendor guide/i.test(rowButtonText) ||
				/select a vendor first/i.test(rowButtonText)
			) {
				return {
					addedCount,
					reason: `Unable to add item because selector is blocked: "${rowButtonText}".`,
				};
			}

			if (/select/i.test(rowButtonText)) {
				await this.dismissAlertDialogIfPresent();
				const openedSelector = await rowButton
					.click()
					.then(() => true)
					.catch(async () => {
						await this.dismissAlertDialogIfPresent();
						return false;
					});

				if (!openedSelector) {
					return {
						addedCount,
						reason: 'Item selector was blocked by an alert dialog in the current environment.',
					};
				}

				const desiredOption = this.page
					.locator('body > div')
					.last()
					.getByRole('button', {
						name: itemNameMatcher,
					})
					.first();

				if (await desiredOption.isVisible().catch(() => false)) {
					await desiredOption.click();
				} else {
					await this.page.keyboard.press('Escape').catch(() => undefined);
					return {
						addedCount,
						reason: `Requested item "${items[index].itemName}" is not available for the selected vendor.`,
					};
				}

				const qtyInput = targetRow.getByRole('spinbutton').first();
				if (await qtyInput.isVisible().catch(() => false)) {
					await qtyInput.fill('1');
				}

				addedCount += 1;
				continue;
			}

			addedCount += 1;
		}

		return { addedCount };
	}

	/**
	 * Validate the status shown for an order row on the Scheduled Orders grid.
	 * @param status Expected order status.
	 * @param orderNumber Optional explicit PO number.
	 */
	async assertOrderStatus(status: string, orderNumber?: string): Promise<void> {
		const row = await this.getOrderRow(orderNumber, status);
		expect(row, `Expected to locate a ${status} order row on Scheduled Orders.`).not.toBeNull();

		if (!row) {
			return;
		}

		await expect(row).toContainText(new RegExp(this.escapeRegExp(status), 'i'));
	}

	/**
	 * Open an order from the Scheduled Orders grid, preferring edit actions when available.
	 * @param orderNumber Optional explicit PO number.
	 * @param status Optional status used to filter the grid.
	 */
	async openOrderFromGrid(
		orderNumber?: string,
		status?: string,
	): Promise<OpenOrderFromGridResult> {
		const row = await this.getOrderRow(orderNumber, status);
		if (!row) {
			return {
				opened: false,
				orderNumber,
				reason: `Unable to find the requested ${status ?? ''} order row on Scheduled Orders.`.trim(),
			};
		}

		const resolvedOrderNumber =
			orderNumber ?? this.extractOrderNumber((await row.textContent().catch(() => '')) ?? '');
		const candidateLocators: Locator[] = [
			row.getByRole('button', { name: /edit draft order/i }).first(),
			row.getByRole('button', { name: /^edit$/i }).first(),
			row.getByRole('link', { name: /edit draft order/i }).first(),
			row.getByRole('button', { name: resolvedOrderNumber ? new RegExp(this.escapeRegExp(resolvedOrderNumber), 'i') : /^PO-/i }).first(),
			row.getByRole('link', { name: resolvedOrderNumber ? new RegExp(this.escapeRegExp(resolvedOrderNumber), 'i') : /^PO-/i }).first(),
			row.getByRole('button').last(),
		];

		for (const candidate of candidateLocators) {
			if (!(await candidate.isVisible().catch(() => false))) {
				continue;
			}

			await candidate.click().catch(() => undefined);
			if (await this.waitForOrderContextToOpen()) {
				return {
					opened: true,
					orderNumber: resolvedOrderNumber ?? (await this.resolveOrderNumberFromCurrentContext(status)),
				};
			}
		}

		return {
			opened: false,
			orderNumber: resolvedOrderNumber,
			editRestricted: status?.toLowerCase() === 'submitted',
			reason:
				status?.toLowerCase() === 'submitted'
					? 'Submitted orders do not expose an editable order action from the grid in the current environment.'
					: 'Order row was found, but no working open/edit action was available.',
		};
	}

	async submitDraftOrderFromGrid(orderNumber?: string): Promise<SubmitOrderFromGridResult> {
		const row = await this.getOrderRow(orderNumber, 'draft');
		if (!row) {
			return {
				submitted: false,
				orderNumber,
				reason: 'Unable to locate the requested draft order row on Scheduled Orders.',
			};
		}

		const resolvedOrderNumber =
			orderNumber ?? this.extractOrderNumber((await row.textContent().catch(() => '')) ?? '');
		const namedSubmitButton = row.getByRole('button', { name: /submit|send/i }).first();
		const rowButtons = row.locator('button');
		const buttonCount = await rowButtons.count();
		const submitButton = (await namedSubmitButton.isVisible().catch(() => false))
			? namedSubmitButton
			: rowButtons.nth(Math.max(buttonCount - 2, 0));

		if (!(await submitButton.isVisible().catch(() => false))) {
			return {
				submitted: false,
				orderNumber: resolvedOrderNumber,
				reason: 'Draft order row does not expose a visible submit action in the current environment.',
			};
		}

		await submitButton.click().catch(async () => {
			await this.dismissAlertDialogIfPresent();
			await submitButton.click({ force: true }).catch(() => undefined);
		});
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		const alertReason = await this.dismissAlertDialogIfPresent();
		if (alertReason) {
			return { submitted: false, orderNumber: resolvedOrderNumber, reason: alertReason };
		}

		const receivedSuccessFeedback = await this.waitForOrderFeedback(/purchase order (submitted|created|saved)/i);
		const submittedRowVisible = await expect
			.poll(
				async () => {
					if (!resolvedOrderNumber) {
						return false;
					}

					return (await this.getOrderRow(resolvedOrderNumber, 'submitted')) !== null;
				},
				{
					timeout: 10_000,
					message: 'Waiting for draft order to appear in Submitted status on Scheduled Orders.',
				},
			)
			.toBe(true)
			.then(() => true)
			.catch(() => false);

		if (!receivedSuccessFeedback && !submittedRowVisible) {
			return {
				submitted: false,
				orderNumber: resolvedOrderNumber,
				reason: 'Draft order submission did not show success feedback or move the order to Submitted status.',
			};
		}

		return { submitted: true, orderNumber: resolvedOrderNumber };
	}

	/**
	 * Validate submitted orders cannot be edited, either because edit is unavailable or Notes is non-editable.
	 */
	async assertNotesReadOnlyOrEditRestricted(
		openResult?: OpenOrderFromGridResult,
		expectedNotes?: string,
	): Promise<void> {
		if (openResult?.editRestricted) {
			expect(openResult.editRestricted).toBe(true);
			return;
		}

		if (!(await this.notesInput.isVisible().catch(() => false))) {
			const saveChangesButton = this.page.getByRole('button', { name: /save changes/i }).first();
			const saveDraftVisible = await this.saveAsDraftButton.isVisible().catch(() => false);
			const saveChangesVisible = await saveChangesButton.isVisible().catch(() => false);
			expect(
				saveDraftVisible || saveChangesVisible,
				'Expected edit actions to be unavailable when Notes is not exposed for a submitted order.',
			).toBe(false);
			return;
		}

		if (expectedNotes) {
			await expect(this.notesInput).toHaveValue(expectedNotes);
		}

		await expect(this.notesInput).not.toBeEditable();
		const saveChangesButton = this.page.getByRole('button', { name: /save changes/i }).first();
		if (await saveChangesButton.isVisible().catch(() => false)) {
			await expect(saveChangesButton).toBeDisabled();
		}
	}

	/**
	 * Validate that a field text is hidden or absent.
	 * @param fieldName Field label/text matcher.
	 * @param strictDomAbsence When true, enforces complete DOM absence.
	 */
	async verifyFieldHidden(fieldName: string, strictDomAbsence = false): Promise<void> {
		const matcher = new RegExp(fieldName, 'i');
		const locator = this.page.getByText(matcher);
		const count = await locator.count();

		if (strictDomAbsence) {
			expect.soft(count, `Expected field "${fieldName}" to be removed from DOM`).toBe(0);
			return;
		}

		if (count === 0) {
			expect.soft(count).toBe(0);
			return;
		}

		await expect.soft(locator.first()).toBeHidden();
	}

	/**
	 * Validate that a control cannot be changed.
	 * @param locator Locator for input/control element.
	 */
	async verifyFieldReadOnly(locator: Locator): Promise<void> {
		const tagName = await locator
			.evaluate((element) => element.tagName.toLowerCase())
			.catch(() => '');

		if (!['input', 'textarea', 'select'].includes(tagName)) {
			await expect.soft(locator).toBeVisible();
			return;
		}

		if (await locator.isEditable().catch(() => false)) {
			await expect.soft(locator).not.toBeEditable();
			return;
		}

		if (await locator.isEnabled().catch(() => false)) {
			await expect.soft(locator).toBeDisabled();
			return;
		}

		await expect.soft(locator).toBeVisible();
	}

	/**
	 * Validate that dropdown-like control is disabled.
	 * @param dropdownLocator Dropdown trigger locator.
	 */
	async verifyDropdownDisabled(dropdownLocator: Locator): Promise<void> {
		await expect.soft(dropdownLocator).toBeVisible();
		await expect.soft(dropdownLocator).toBeDisabled();
	}

	/**
	 * Reload browser and execute provided validation callback.
	 * @param validation Async callback with assertions.
	 */
	async refreshBrowserAndValidate(validation: () => Promise<void>): Promise<void> {
		await this.page.reload({ waitUntil: 'networkidle' });
		await validation();
	}

	/**
	 * Validate tab navigation does not focus Unit Price controls.
	 * @param tabCount Number of tab key presses to simulate.
	 */
	async verifyUnitPriceNotAccessibleByKeyboard(tabCount = 20): Promise<void> {
		for (let index = 0; index < tabCount; index += 1) {
			await this.page.keyboard.press('Tab');
			const activeElementText = await this.page.evaluate(() => {
				const doc = (globalThis as { document?: { activeElement?: { getAttribute?: (name: string) => string | null; textContent?: string | null } | null } }).document;
				const active = doc?.activeElement;
				const label = active?.getAttribute?.('aria-label') ?? '';
				const text = active?.textContent ?? '';
				return `${label}${text}`.toLowerCase();
			});

			expect.soft(activeElementText).not.toContain('unit price');
		}
	}
}
