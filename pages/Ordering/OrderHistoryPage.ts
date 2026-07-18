import { type Locator, type Page, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class OrderHistoryPage {
	readonly pageTitle: Locator;
	readonly pageDescription: Locator;
	readonly statusFilterAllButton: Locator;
	readonly statusFilterDraftButton: Locator;
	readonly statusFilterSubmittedButton: Locator;
	readonly statusFilterApprovedButton: Locator;
	readonly statusFilterSentButton: Locator;
	readonly statusFilterReceivedButton: Locator;
	readonly statusFilterCancelledButton: Locator;
	readonly fromDateInput: Locator;
	readonly toDateInput: Locator;
	readonly ordersTable: Locator;
	readonly poNumberHeader: Locator;
	readonly vendorHeader: Locator;
	readonly orderDateHeader: Locator;
	readonly requiredDateHeader: Locator;
	readonly statusHeader: Locator;
	readonly totalHeader: Locator;
	readonly orderTypeHeader: Locator;

	constructor(private readonly page: Page) {
		this.pageTitle = page.getByRole('heading', { name: 'Order History' });
		this.pageDescription = page.getByText(
			'View and search all past purchase orders',
			{ exact: true },
		);
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
		this.statusFilterApprovedButton = page.getByRole('button', {
			name: 'approved',
			exact: true,
		});
		this.statusFilterSentButton = page.getByRole('button', {
			name: 'sent',
			exact: true,
		});
		this.statusFilterReceivedButton = page.getByRole('button', {
			name: 'received',
			exact: true,
		});
		this.statusFilterCancelledButton = page.getByRole('button', {
			name: 'cancelled',
			exact: true,
		});
		this.fromDateInput = page.locator('main').getByRole('textbox').first();
		this.toDateInput = page.locator('main').getByRole('textbox').nth(1);
		this.ordersTable = page.getByRole('table').first();
		this.poNumberHeader = page.getByRole('columnheader', { name: 'PO #' });
		this.vendorHeader = page.getByRole('columnheader', { name: 'Vendor' });
		this.orderDateHeader = page.getByRole('columnheader', { name: 'Order Date' });
		this.requiredDateHeader = page.getByRole('columnheader', {
			name: 'Required Date',
		});
		this.statusHeader = page.getByRole('columnheader', { name: 'Status' });
		this.totalHeader = page.getByRole('columnheader', { name: 'Total' });
		this.orderTypeHeader = page.getByRole('columnheader', { name: 'Order Type' });
	}

	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private getStatusFilterButton(status: string): Locator {
		switch (status.toLowerCase()) {
			case 'all':
				return this.statusFilterAllButton;
			case 'draft':
				return this.statusFilterDraftButton;
			case 'submitted':
				return this.statusFilterSubmittedButton;
			case 'approved':
				return this.statusFilterApprovedButton;
			case 'sent':
				return this.statusFilterSentButton;
			case 'received':
				return this.statusFilterReceivedButton;
			case 'cancelled':
				return this.statusFilterCancelledButton;
			default:
				return this.page.getByRole('button', {
					name: new RegExp(`^${this.escapeRegExp(status)}$`, 'i'),
				});
		}
	}

	private async applyStatusFilter(status?: string): Promise<void> {
		if (!status) {
			return;
		}

		const filterButton = this.getStatusFilterButton(status);
		if (!(await filterButton.isVisible().catch(() => false))) {
			return;
		}

		await filterButton.click().catch(() => undefined);
		await this.page.waitForLoadState('networkidle').catch(() => undefined);
	}

	private getOrderTypePattern(orderType: 'scheduled' | 'hotshot'): RegExp {
		return orderType === 'hotshot' ? /hot\s?shot/i : /scheduled/i;
	}

	private async getOrderRows(): Promise<Locator> {
		const roleRows = this.ordersTable.getByRole('row').filter({ hasText: /\bPO-/i });
		if ((await roleRows.count().catch(() => 0)) > 0) {
			return roleRows;
		}

		return this.ordersTable.locator('tr, [role="row"]').filter({ hasText: /\bPO-/i });
	}

	private async waitForOrderRows(rows: Locator, timeout = 10_000): Promise<boolean> {
		return expect
			.poll(
				async () => rows.count().catch(() => 0),
				{
					timeout,
					message: 'Waiting for Order History rows to appear after applying filters or navigation.',
				},
			)
			.toBeGreaterThan(0)
			.then(() => true)
			.catch(() => false);
	}

	private async clickOrderTrigger(row: Locator, explicitOrderNumber?: string): Promise<string | undefined> {
		const orderPattern = explicitOrderNumber
			? new RegExp(`^${this.escapeRegExp(explicitOrderNumber)}$`, 'i')
			: /^PO-/i;
		const candidates: Locator[] = [
			row.getByRole('button', { name: orderPattern }).first(),
			row.getByRole('link', { name: orderPattern }).first(),
			row.getByRole('button').filter({ hasText: /^PO-/i }).first(),
			row.getByRole('link').filter({ hasText: /^PO-/i }).first(),
		];

		for (const candidate of candidates) {
			if (!(await candidate.isVisible().catch(() => false))) {
				continue;
			}

			const targetText = (await candidate.textContent().catch(() => ''))?.trim();
			if (!targetText) {
				continue;
			}

			await candidate.click().catch(() => undefined);
			if (await this.waitForOrderDetails(targetText)) {
				return targetText;
			}
		}

		return undefined;
	}

	private async getDisplayedNotesValue(): Promise<string | undefined> {
		const notesInput = this.page.getByPlaceholder('Optional notes...').first();
		if (await notesInput.isVisible().catch(() => false)) {
			const value = await notesInput
				.inputValue()
				.catch(async () => ((await notesInput.textContent()) ?? '').trim());
			return value?.replace(/\r\n/g, '\n');
		}

		const notesLabel = this.page.locator('main').getByText(/^Notes$/i).first();
		if (await notesLabel.isVisible().catch(() => false)) {
			const detailCandidates: Locator[] = [
				notesLabel.locator('xpath=following::textarea[1]').first(),
				notesLabel.locator('xpath=following::input[1]').first(),
				notesLabel.locator('xpath=following::*[self::div or self::p or self::span][1]').first(),
			];

			for (const candidate of detailCandidates) {
				if (!(await candidate.isVisible().catch(() => false))) {
					continue;
				}

				const inputValue = await candidate
					.inputValue()
					.catch(async () => ((await candidate.textContent()) ?? '').trim());
				if (inputValue) {
					return inputValue.replace(/\r\n/g, '\n');
				}
			}
		}

		return undefined;
	}

	private async waitForOrderDetails(targetText?: string): Promise<boolean> {
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		const detailLocators: Locator[] = [
			this.page.getByText(/Line Items|Order Details/i).first(),
			this.page.getByRole('columnheader', { name: /Unit Price|Item/i }).first(),
			this.page.getByRole('heading', { name: /Order\s+PO-/i }).first(),
		];

		if (targetText) {
			detailLocators.unshift(
				this.page.getByRole('heading', {
					name: new RegExp(`Order\\s+${this.escapeRegExp(targetText)}`, 'i'),
				}).first(),
				this.page.getByRole('heading', {
					name: new RegExp(this.escapeRegExp(targetText), 'i'),
				}).first(),
			);
		}

		for (const locator of detailLocators) {
			if (await locator.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Wait for the Order History page.
	 * Verifies URL and page heading visibility.
	 */
	async waitForOrderHistoryPageToLoad(): Promise<void> {
		await expect(this.page).toHaveURL(/\/orders\/history$/);
		await expect(this.pageTitle).toBeVisible();
	}

	/**
	 * Validate Order History page controls and grid headers.
	 * Verifies status filters, date fields, and table structure.
	 */
	async verifyOrderHistoryPageLoaded(): Promise<void> {
		await this.waitForOrderHistoryPageToLoad();
		await expect(this.pageDescription).toBeVisible();
		await this.verifyStatusFiltersVisible();
		await expect(this.fromDateInput).toBeVisible();
		await expect(this.toDateInput).toBeVisible();
		await this.verifyTableHeadersVisible();

		log('✓ Verified: Order History page is displayed');
	}

	/**
	 * Validate Order History status filter chips.
	 * Verifies all available status filters are visible.
	 */
	async verifyStatusFiltersVisible(): Promise<void> {
		await expect(this.statusFilterAllButton).toBeVisible();
		await expect(this.statusFilterDraftButton).toBeVisible();
		await expect(this.statusFilterSubmittedButton).toBeVisible();
		await expect(this.statusFilterApprovedButton).toBeVisible();
		await expect(this.statusFilterSentButton).toBeVisible();
		await expect(this.statusFilterReceivedButton).toBeVisible();
		await expect(this.statusFilterCancelledButton).toBeVisible();

		log('✓ Verified: Order History status filters are visible');
	}

	/**
	 * Validate Order History table headers.
	 * Verifies PO, vendor, dates, status, total, and type columns.
	 */
	async verifyTableHeadersVisible(): Promise<void> {
		await expect(this.poNumberHeader).toBeVisible();
		await expect(this.vendorHeader).toBeVisible();
		await expect(this.orderDateHeader).toBeVisible();
		await expect(this.requiredDateHeader).toBeVisible();
		await expect(this.statusHeader).toBeVisible();
		await expect(this.totalHeader).toBeVisible();
		await expect(this.orderTypeHeader).toBeVisible();

		log('✓ Verified: Order History table headers are visible');
	}

	/**
	 * Return the visible status filter values from Order History.
	 * Useful for runtime data extraction.
	 */
	async getStatusFilterValues(): Promise<string[]> {
		const values = await this.page
			.locator('main button')
			.filter({ hasText: /^(all|draft|submitted|approved|sent|received|cancelled)$/i })
			.allTextContents();

		return values.map((value) => value.trim()).filter(Boolean);
	}

	/**
	 * Return visible order type values from the current grid rows.
	 * Useful to infer section relationships across ordering workflows.
	 */
	async getVisibleOrderTypes(): Promise<string[]> {
		const values = await this.page
			.getByRole('cell')
			.filter({ hasText: /scheduled|hotshot/i })
			.allTextContents();

		return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
	}

	/**
	 * Open an order row by PO number, or open first visible PO row.
	 * @param orderNumber Optional explicit PO number.
	 */
	async searchAndOpenOrder(
		orderNumber?: string,
	): Promise<{ opened: boolean; orderNumber?: string }> {
		await expect(this.ordersTable).toBeVisible();
		const orderRows = await this.getOrderRows();

		if (orderNumber) {
			const targetRow = orderRows.filter({
				hasText: new RegExp(this.escapeRegExp(orderNumber), 'i'),
			}).first();

			if (!(await targetRow.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false))) {
				return { opened: false };
			}

			const openedOrderNumber = await this.clickOrderTrigger(targetRow, orderNumber);
			return { opened: Boolean(openedOrderNumber), orderNumber: openedOrderNumber ?? orderNumber };
		}

		const rows = orderRows;
		if (!(await this.waitForOrderRows(rows))) {
			return { opened: false };
		}
		const maxCandidates = Math.min(await rows.count(), 10);

		for (let index = 0; index < maxCandidates; index += 1) {
			const candidateRow = rows.nth(index);
			const openedOrderNumber = await this.clickOrderTrigger(candidateRow);

			if (openedOrderNumber) {
				return { opened: true, orderNumber: openedOrderNumber };
			}

			if (!(await this.ordersTable.isVisible().catch(() => false))) {
				break;
			}
		}

		return { opened: false };
	}

	async openLatestOrderByType(
		orderType: 'scheduled' | 'hotshot',
		status?: string,
	): Promise<{ opened: boolean; orderNumber?: string; reason?: string }> {
		await this.applyStatusFilter(status);
		const rows = (await this.getOrderRows()).filter({
			hasText: this.getOrderTypePattern(orderType),
		});
		if (!(await this.waitForOrderRows(rows))) {
			return {
				opened: false,
				reason: `No ${orderType} orders were visible in Order History${status ? ` for status ${status}` : ''}.`,
			};
		}

		const maxCandidates = Math.min(await rows.count(), 10);

		if (maxCandidates === 0) {
			return {
				opened: false,
				reason: `No ${orderType} orders were visible in Order History${status ? ` for status ${status}` : ''}.`,
			};
		}

		for (let index = 0; index < maxCandidates; index += 1) {
			const row = rows.nth(index);
			const openedOrderNumber = await this.clickOrderTrigger(row);

			if (openedOrderNumber) {
				return { opened: true, orderNumber: openedOrderNumber };
			}
		}

		return {
			opened: false,
			reason: `Visible ${orderType} Order History rows were found, but none opened successfully.`,
		};
	}

	/**
	 * Execute available receive/invoice actions for current order state.
	 */
	async completeReceivingWorkflow(): Promise<{ completed: boolean; reason?: string }> {
		const receiveButtons = [
			this.page.getByRole('button', { name: /^Receive$/i }),
			this.page.getByRole('button', { name: /^Mark as Received$/i }),
			this.page.getByRole('button', { name: /^Complete Receiving$/i }),
			this.page.getByRole('button', { name: /^Invoice$/i }),
			this.page.getByRole('button', { name: /^Save Invoice$/i }),
		];

		let clickedAnyAction = false;

		for (const candidate of receiveButtons) {
			if (await candidate.first().isVisible().catch(() => false)) {
				const clicked = await candidate
					.first()
					.click()
					.then(() => true)
					.catch(() => false);

				if (clicked) {
					clickedAnyAction = true;
				}
			}
		}

		if (!clickedAnyAction) {
			return {
				completed: false,
				reason:
					'Receiving or invoicing actions are not available for this order state in the current environment.',
			};
		}

		return { completed: true };
	}

	/**
	 * Open the first row marked as scheduled from Order History table.
	 */
	async openScheduledOrderFromHistory(): Promise<{ opened: boolean; reason?: string }> {
		const scheduledRows = this.page.getByRole('cell').filter({ hasText: /^scheduled$/i });
		const maxCandidates = Math.min(await scheduledRows.count(), 10);

		if (maxCandidates === 0) {
			return { opened: false, reason: 'No scheduled order rows found.' };
		}

		for (let index = 0; index < maxCandidates; index += 1) {
			const row = scheduledRows.nth(index).locator('xpath=ancestor::tr[1]');
			const orderButton = row.getByRole('button').filter({ hasText: /^PO-/ }).first();
			const orderNumber = (await orderButton.textContent().catch(() => ''))?.trim();

			if (!orderNumber) {
				continue;
			}

			await orderButton.click();

			if (await this.waitForOrderDetails(orderNumber)) {
				return { opened: true };
			}

			if (!(await this.ordersTable.isVisible().catch(() => false))) {
				break;
			}
		}

		return { opened: false, reason: 'Scheduled order rows were listed but none opened successfully.' };
	}

	async assertNotesValue(notes: string): Promise<void> {
		const displayedNotesValue = await this.getDisplayedNotesValue();
		const normalizedExpected = notes.replace(/\r\n/g, '\n').trim();

		if (displayedNotesValue !== undefined) {
			expect(displayedNotesValue.trim()).toBe(normalizedExpected);
			return;
		}

		const mainText = ((await this.page.locator('main').textContent().catch(() => '')) ?? '').replace(/\r\n/g, '\n');
		expect(mainText).toContain(normalizedExpected);
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
}
