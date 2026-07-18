import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export type MonthlyCountShift = 'AM' | 'Mid-Shift' | 'PM';

export class MonthlyCountPage {
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly newMonthlyCountButton: Locator;
  readonly monthlyCountTable: Locator;
  readonly countIdHeader: Locator;
  readonly nameHeader: Locator;
  readonly timingHeader: Locator;
  readonly statusHeader: Locator;
  readonly timeCreatedHeader: Locator;
  readonly createMonthlyCountDialogTitle: Locator;
  readonly startMonthlyCountButton: Locator;
  readonly cancelCreateMonthlyCountButton: Locator;
  readonly detailHeading: Locator;
  readonly detailCreatedAtText: Locator;
  readonly exportButton: Locator;
  readonly addItemButton: Locator;
  readonly deleteButton: Locator;
  readonly totalItemsCardLabel: Locator;
  readonly countedItemsCardLabel: Locator;
  readonly remainingItemsCardLabel: Locator;
  readonly flaggedItemsCardLabel: Locator;
  readonly locationsHeading: Locator;
  readonly allItemsLocationButton: Locator;
  readonly itemSearchInput: Locator;
  readonly itemTable: Locator;
  readonly locationHeader: Locator;
  readonly itemHeader: Locator;
  readonly expectedHeader: Locator;
  readonly countedHeader: Locator;
  readonly varianceHeader: Locator;
  readonly itemStatusHeader: Locator;
  readonly actionsHeader: Locator;
  readonly noItemsYetMessage: Locator;
  readonly noItemsMatchFiltersMessage: Locator;
  readonly addItemDialogTitle: Locator;
  readonly addItemSearchInput: Locator;
  readonly selectLocationsButton: Locator;
  readonly cancelAddItemButton: Locator;
  readonly confirmAddItemButton: Locator;

  constructor(private readonly page: Page) {
    this.pageTitle = page.getByRole('heading', { name: 'Monthly Count' });
    this.pageDescription = page.getByText(
      'Monthly comprehensive inventory audit',
      { exact: true },
    );
    this.newMonthlyCountButton = page.getByRole('button', {
      name: /new monthly count/i,
    });
    this.monthlyCountTable = page.getByRole('table').first();
    this.countIdHeader = page.getByRole('columnheader', { name: 'Count ID' });
    this.nameHeader = page.getByRole('columnheader', { name: 'Name' });
    this.timingHeader = page.getByRole('columnheader', { name: 'Timing' });
    this.statusHeader = page.getByRole('columnheader', { name: 'Status' });
    this.timeCreatedHeader = page.getByRole('columnheader', {
      name: 'Time Created',
    });
    this.createMonthlyCountDialogTitle = page
      .getByText('New Monthly Count', { exact: true })
      .nth(1);
    this.startMonthlyCountButton = page.getByRole('button', {
      name: 'Start Monthly Count',
    });
    this.cancelCreateMonthlyCountButton = page.getByRole('button', {
      name: 'Cancel',
    });
    this.detailHeading = page.getByRole('heading').first();
    this.detailCreatedAtText = page.getByText(/Created at:/i);
    this.exportButton = page.getByRole('button', {
      name: 'Export',
      exact: true,
    });
    this.addItemButton = page.getByRole('button', {
      name: 'Add Item',
      exact: true,
    });
    this.deleteButton = page.getByRole('button', {
      name: 'Delete',
      exact: true,
    });
    this.totalItemsCardLabel = page.getByText('Total Items', { exact: true });
    this.countedItemsCardLabel = page
      .getByText('Counted', { exact: true })
      .first();
    this.remainingItemsCardLabel = page.getByText('Remaining', { exact: true });
    this.flaggedItemsCardLabel = page.getByText('Flagged', { exact: true });
    this.locationsHeading = page.getByText('Locations', { exact: true });
    this.allItemsLocationButton = page.getByRole('button', {
      name: /^All Items\b/i,
    });
    this.itemSearchInput = page.getByPlaceholder('Item name or SKU');
    this.itemTable = page.getByRole('table').first();
    this.locationHeader = page.getByRole('columnheader', { name: 'Location' });
    this.itemHeader = page.getByRole('columnheader', { name: 'Item' });
    this.expectedHeader = page.getByRole('columnheader', { name: 'Expected' });
    this.countedHeader = page.getByRole('columnheader', { name: 'Counted' });
    this.varianceHeader = page.getByRole('columnheader', { name: 'Variance' });
    this.itemStatusHeader = page.getByRole('columnheader', { name: 'Status' });
    this.actionsHeader = page.getByRole('columnheader', { name: 'Actions' });
    this.noItemsYetMessage = page.getByText(
      'No items yet. Use "+ Add Item" to get started.',
      { exact: true },
    );
    this.noItemsMatchFiltersMessage = page.getByText(
      'No items match these filters.',
      { exact: true },
    );
    this.addItemDialogTitle = page.getByText('Add Item to Monthly Count', {
      exact: true,
    });
    this.addItemSearchInput = page.getByPlaceholder(/Search by name or PLU/i);
    this.selectLocationsButton = page.getByRole('button', {
      name: /select locations/i,
    });
    this.cancelAddItemButton = page.getByRole('button', { name: 'Cancel' });
    this.confirmAddItemButton = page.getByRole('button', {
      name: 'Add Item',
      exact: true,
    }).last();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getCountRow(identifier: string): Locator {
    return this.monthlyCountTable.getByRole('row', {
      name: new RegExp(this.escapeRegExp(identifier), 'i'),
    });
  }

  private getCreateDialogTextboxes(): Locator {
    return this.page.getByRole('textbox');
  }

  private getShiftDateInput(): Locator {
    return this.getCreateDialogTextboxes().nth(0);
  }

  private getMonthlyCountNameInput(): Locator {
    return this.getCreateDialogTextboxes().nth(1);
  }

  private getShiftTriggerButton(): Locator {
    return this.page
      .getByRole('button', { name: /^(AM|Mid-Shift|PM)$/i })
      .first();
  }

  private getShiftOptionButton(shift: MonthlyCountShift): Locator {
    return this.page
      .getByRole('button', {
        name: new RegExp(`^${this.escapeRegExp(shift)}$`, 'i'),
      })
      .last();
  }

  private getLocationButton(locationName: string): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(`^${this.escapeRegExp(locationName)}\\b`, 'i'),
    });
  }

  private getItemRow(itemNameOrSku: string): Locator {
    return this.itemTable.getByRole('row', {
      name: new RegExp(this.escapeRegExp(itemNameOrSku), 'i'),
    });
  }

  private getItemDeleteButton(itemNameOrSku: string): Locator {
    return this.getItemRow(itemNameOrSku).getByRole('button', {
      name: new RegExp(`^Delete ${this.escapeRegExp(itemNameOrSku)}`, 'i'),
    });
  }

  private getLocationPickerOption(locationName: string): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(`^${this.escapeRegExp(locationName)}$`, 'i'),
    });
  }

  private getClearSearchButton(): Locator {
    return this.page.getByRole('button', { name: 'Clear' });
  }

  private getCloseDialogButton(): Locator {
    return this.page.getByRole('button', { name: 'Close dialog' });
  }

  private async prepareForDialogResponse(acceptDialog: boolean): Promise<void> {
    this.page.once('dialog', async (dialog) => {
      if (acceptDialog) {
        await dialog.accept();
        return;
      }

      await dialog.dismiss();
    });
  }

  /**
   * Wait for the Monthly Count listing page to finish loading.
   * Verifies: the listing URL, page title, and main table are visible.
   * Parameters: None.
   */
  async waitForMonthlyCountPageToLoad(): Promise<void> {
    await expect(this.page).toHaveURL(/\/counts\/monthly$/);
    await expect(this.pageTitle).toBeVisible();
    await expect(this.monthlyCountTable).toBeVisible();
  }

  /**
   * Wait for a Monthly Count details page to finish loading.
   * Verifies: the details URL, created-at metadata, and item table are visible.
   * Parameters: None.
   */
  async waitForMonthlyCountDetailsToLoad(): Promise<void> {
    await expect(this.page).toHaveURL(/\/counts\/monthly\/\d+$/);
    await expect(this.detailCreatedAtText).toBeVisible();
    await expect(this.itemTable).toBeVisible();
  }

  /**
   * Validate that the Monthly Count listing page is fully rendered.
   * Verifies: page load state, description text, primary action, and listing headers.
   * Parameters: None.
   */
  async verifyMonthlyCountPageLoaded(): Promise<void> {
    await this.waitForMonthlyCountPageToLoad();
    await expect(this.pageDescription).toBeVisible();
    await this.verifyNewMonthlyCountButtonEnabled();
    await this.verifyMonthlyCountTableHeaders();

    log('✓ Verified: Monthly Count page is displayed');
  }

  /**
   * Validate that the New Monthly Count primary action is available.
   * Verifies: the button is visible and enabled.
   * Parameters: None.
   */
  async verifyNewMonthlyCountButtonEnabled(): Promise<void> {
    await expect(this.newMonthlyCountButton).toBeVisible();
    await expect(this.newMonthlyCountButton).toBeEnabled();

    log('✓ Verified: + NEW MONTHLY COUNT button is enabled');
  }

  /**
   * Validate the column structure of the Monthly Count listing grid.
   * Verifies: Count ID, Name, Timing, Status, and Time Created headers are visible.
   * Parameters: None.
   */
  async verifyMonthlyCountTableHeaders(): Promise<void> {
    await expect(this.countIdHeader).toBeVisible();
    await expect(this.nameHeader).toBeVisible();
    await expect(this.timingHeader).toBeVisible();
    await expect(this.statusHeader).toBeVisible();
    await expect(this.timeCreatedHeader).toBeVisible();

    log('✓ Verified: Monthly Count table headers are visible');
  }

  /**
   * Validate that a specific Monthly Count row is present on the listing page.
   * Verifies: a row matching the supplied identifier is visible.
   * @param identifier Row text, count ID, or unique name fragment used to locate the Monthly Count.
   */
  async verifyMonthlyCountExists(identifier: string): Promise<void> {
    await expect(this.getCountRow(identifier)).toBeVisible();

    log(`✓ Verified: Monthly Count "${identifier}" is visible in the listing`);
  }

  /**
   * Open the New Monthly Count creation dialog.
   * Verifies: the trigger is enabled before click, then the dialog becomes visible.
   * Parameters: None.
   */
  async clickNewMonthlyCountButton(): Promise<void> {
    log('Clicking on + NEW MONTHLY COUNT button');

    await expect(this.newMonthlyCountButton).toBeEnabled();
    await this.newMonthlyCountButton.click();
    await this.verifyNewMonthlyCountDialogVisible();

    log('✓ Clicked on + NEW MONTHLY COUNT button');
  }

  /**
   * Validate the New Monthly Count dialog contents.
   * Verifies: title, shift selector, shift date field, readonly generated name, and start button state.
   * Parameters: None.
   */
  async verifyNewMonthlyCountDialogVisible(): Promise<void> {
    await expect(this.createMonthlyCountDialogTitle).toBeVisible();
    await expect(this.getShiftTriggerButton()).toBeVisible();
    await expect(this.getShiftDateInput()).toBeVisible();
    await expect(this.getMonthlyCountNameInput()).toBeVisible();
    await this.verifyMonthlyCountNameReadOnly();
    await expect(this.startMonthlyCountButton).toBeVisible();
    await expect(this.startMonthlyCountButton).toBeEnabled();

    log('✓ Verified: New Monthly Count dialog is displayed');
  }

  /**
   * Validate that the generated Monthly Count name field cannot be edited manually.
   * Verifies: the dialog name textbox is visible and read-only.
   * Parameters: None.
   */
  async verifyMonthlyCountNameReadOnly(): Promise<void> {
    await expect(this.getMonthlyCountNameInput()).toBeVisible();
    await expect(this.getMonthlyCountNameInput()).not.toBeEditable();

    log('✓ Verified: Monthly Count name is auto-generated and read-only');
  }

  /**
   * Choose the shift used for Monthly Count creation.
   * Verifies: the requested shift value is shown on the selector after the update.
   * @param shift Shift option to select: `AM`, `Mid-Shift`, or `PM`.
   */
  async selectShift(shift: MonthlyCountShift): Promise<void> {
    log(`Selecting "${shift}" shift for Monthly Count`);

    await this.getShiftTriggerButton().click();
    await this.getShiftOptionButton(shift).click();
    await expect(
      this.page
        .getByRole('button', {
          name: new RegExp(`^${this.escapeRegExp(shift)}$`, 'i'),
        })
        .first(),
    ).toBeVisible();

    log(`✓ Selected "${shift}" shift for Monthly Count`);
  }

  /**
   * Update the Monthly Count shift date in the creation dialog.
   * Verifies: the shift date textbox reflects the provided date value.
   * @param shiftDate Date value to enter in `YYYY-MM-DD` format.
   */
  async fillShiftDate(shiftDate: string): Promise<void> {
    log(`Entering Monthly Count shift date: ${shiftDate}`);

    await this.getShiftDateInput().fill(shiftDate);
    await expect(this.getShiftDateInput()).toHaveValue(shiftDate);

    log(`✓ Entered Monthly Count shift date: ${shiftDate}`);
  }

  /**
   * Submit the New Monthly Count dialog.
   * Verifies: the start button is enabled before click, then the details page loads.
   * Parameters: None.
   */
  async clickStartMonthlyCountButton(): Promise<void> {
    log('Clicking on START MONTHLY COUNT button');

    await expect(this.startMonthlyCountButton).toBeEnabled();
    await this.startMonthlyCountButton.click();
    await this.waitForMonthlyCountDetailsToLoad();

    log('✓ Clicked on START MONTHLY COUNT button');
  }

  /**
   * Create a Monthly Count using the dialog controls.
   * Verifies: dialog interactions succeed and the new count opens on the details page.
   * @param shift Shift value to use for the new Monthly Count.
   * @param options Optional data for Monthly Count creation.
   * @param options.shiftDate Optional `YYYY-MM-DD` shift date to override the default date.
   */
  async startMonthlyCount(
    shift: MonthlyCountShift,
    options?: { shiftDate?: string },
  ): Promise<void> {
    await this.clickNewMonthlyCountButton();
    await this.selectShift(shift);

    if (options?.shiftDate) {
      await this.fillShiftDate(options.shiftDate);
    }

    await this.clickStartMonthlyCountButton();

    log(`✓ Created Monthly Count for shift "${shift}"`);
  }

  /**
   * Dismiss the New Monthly Count dialog without creating a count.
   * Verifies: the dialog closes after the cancel action.
   * Parameters: None.
   */
  async cancelNewMonthlyCount(): Promise<void> {
    log('Cancelling Monthly Count creation');

    await this.cancelCreateMonthlyCountButton.click();
    await expect(this.startMonthlyCountButton).toBeHidden();

    log('✓ Cancelled Monthly Count creation');
  }

  /**
   * Close the currently open modal dialog using the dialog close control.
   * Verifies: the close button is available and the dialog is dismissed.
   * Parameters: None.
   */
  async closeActiveDialog(): Promise<void> {
    await expect(this.getCloseDialogButton()).toBeVisible();
    await this.getCloseDialogButton().click();
    await expect(this.getCloseDialogButton()).toBeHidden();

    log('✓ Closed the active dialog');
  }

  /**
   * Open a specific Monthly Count from the listing page.
   * Verifies: the requested row is visible before click, then the details page loads.
   * @param identifier Row text, count ID, or unique name fragment used to locate the Monthly Count.
   */
  async openMonthlyCount(identifier: string): Promise<void> {
    log(`Opening Monthly Count "${identifier}"`);

    const countRow = this.getCountRow(identifier);
    await expect(countRow).toBeVisible();
    await countRow.click();
    await this.waitForMonthlyCountDetailsToLoad();

    log(`✓ Opened Monthly Count "${identifier}"`);
  }

  /**
   * Open the first Monthly Count row displayed in the listing grid.
   * Verifies: the first data row exists and the details page loads.
   * Parameters: None.
   */
  async openFirstMonthlyCount(): Promise<void> {
    log('Opening the first Monthly Count from the listing');

    const firstDataRow = this.monthlyCountTable.getByRole('row').nth(1);
    await expect(firstDataRow).toBeVisible();
    await firstDataRow.click();
    await this.waitForMonthlyCountDetailsToLoad();

    log('✓ Opened the first Monthly Count from the listing');
  }

  /**
   * Delete a Monthly Count from the listing page using the row action.
   * Verifies: the native confirm dialog is handled and the row is removed only when accepted.
   * @param identifier Row text, count ID, or unique name fragment used to locate the Monthly Count.
   * @param acceptDelete Whether to accept the native delete confirmation. Defaults to `true`.
   */
  async deleteMonthlyCountFromList(
    identifier: string,
    acceptDelete = true,
  ): Promise<void> {
    log(`Deleting Monthly Count "${identifier}" from the listing`);

    const countRow = this.getCountRow(identifier);
    const deleteCountButton = countRow.getByRole('button', {
      name: 'Delete count',
    });

    await expect(countRow).toBeVisible();
    await this.prepareForDialogResponse(acceptDelete);
    await deleteCountButton.click();

    if (acceptDelete) {
      await expect(countRow).toBeHidden();
      log(`✓ Deleted Monthly Count "${identifier}" from the listing`);
      return;
    }

    await expect(countRow).toBeVisible();
    log(`✓ Dismissed delete confirmation for Monthly Count "${identifier}"`);
  }

  /**
   * Validate that the Monthly Count details page is fully rendered.
   * Verifies: detail load state, metadata, header actions, summary cards, and item-table structure.
   * Parameters: None.
   */
  async verifyMonthlyCountDetailsPageLoaded(): Promise<void> {
    await this.waitForMonthlyCountDetailsToLoad();
    await expect(this.detailHeading).toBeVisible();
    await expect(this.detailCreatedAtText).toBeVisible();
    await this.verifyDetailActionButtonsVisible();
    await this.verifySummaryCardsVisible();
    await this.verifyItemTableHeaders();

    log('✓ Verified: Monthly Count details page is displayed');
  }

  /**
   * Validate the header action controls on the Monthly Count details page.
   * Verifies: Export, Add Item, and Delete actions are visible.
   * Parameters: None.
   */
  async verifyDetailActionButtonsVisible(): Promise<void> {
    await expect(this.exportButton).toBeVisible();
    await expect(this.addItemButton).toBeVisible();
    await expect(this.deleteButton).toBeVisible();

    log('✓ Verified: Monthly Count detail actions are visible');
  }

  /**
   * Validate the empty-count export restriction on the Monthly Count details page.
   * Verifies: the Export button is visible but disabled.
   * Parameters: None.
   */
  async verifyExportButtonDisabled(): Promise<void> {
    await expect(this.exportButton).toBeVisible();
    await expect(this.exportButton).toBeDisabled();

    log('✓ Verified: Export is disabled for an empty Monthly Count');
  }

  /**
   * Validate the summary cards displayed on the Monthly Count details page.
   * Verifies: Total Items, Counted, Remaining, and Flagged summary labels are visible.
   * Parameters: None.
   */
  async verifySummaryCardsVisible(): Promise<void> {
    await expect(this.totalItemsCardLabel).toBeVisible();
    await expect(this.countedItemsCardLabel).toBeVisible();
    await expect(this.remainingItemsCardLabel).toBeVisible();
    await expect(this.flaggedItemsCardLabel).toBeVisible();

    log('✓ Verified: Monthly Count summary cards are visible');
  }

  /**
   * Validate the column structure of the Monthly Count item table.
   * Verifies: Location, Item, Expected, Counted, Variance, Status, and Actions headers are visible.
   * Parameters: None.
   */
  async verifyItemTableHeaders(): Promise<void> {
    await expect(this.locationHeader).toBeVisible();
    await expect(this.itemHeader).toBeVisible();
    await expect(this.expectedHeader).toBeVisible();
    await expect(this.countedHeader).toBeVisible();
    await expect(this.varianceHeader).toBeVisible();
    await expect(this.itemStatusHeader).toBeVisible();
    await expect(this.actionsHeader).toBeVisible();

    log('✓ Verified: Monthly Count item table headers are visible');
  }

  /**
   * Validate the empty-state guidance shown when no Monthly Count items exist.
   * Verifies: the empty-state message is visible in the table body.
   * Parameters: None.
   */
  async verifyEmptyMonthlyCountMessageVisible(): Promise<void> {
    await expect(this.noItemsYetMessage).toBeVisible();

    log('✓ Verified: Empty-state message is displayed for Monthly Count items');
  }

  /**
   * Select a location filter on the Monthly Count details page.
   * Verifies: the requested location button is available and clicked.
   * @param locationName Location filter label, for example `All Items` or `Walk-In Cooler`.
   */
  async selectLocation(locationName: string): Promise<void> {
    log(`Selecting Monthly Count location filter: ${locationName}`);

    const locationButton = this.getLocationButton(locationName);
    await expect(locationButton).toBeVisible();
    await locationButton.click();

    log(`✓ Selected Monthly Count location filter: ${locationName}`);
  }

  /**
   * Apply location and optional search filters on the Monthly Count details page.
   * Verifies: the requested location is selected and the search field is populated when provided.
   * @param locationName Location filter label to apply.
   * @param searchTerm Optional item name or SKU search term.
   */
  async applyFilters(locationName: string, searchTerm?: string): Promise<void> {
    await this.selectLocation(locationName);

    if (searchTerm) {
      await this.searchItem(searchTerm);
    }

    log('✓ Applied Monthly Count filters');
  }

  /**
   * Search for an item on the Monthly Count details page.
   * Verifies: the item search box contains the provided value.
   * @param itemNameOrSku Item name or SKU fragment to search for.
   */
  async searchItem(itemNameOrSku: string): Promise<void> {
    log(`Searching for Monthly Count item: ${itemNameOrSku}`);

    await this.itemSearchInput.fill(itemNameOrSku);
    await expect(this.itemSearchInput).toHaveValue(itemNameOrSku);

    log(`✓ Searched for Monthly Count item: ${itemNameOrSku}`);
  }

  /**
   * Reset Monthly Count filters back to the default empty search and All Items location.
   * Verifies: All Items is selected and the search box is cleared.
   * Parameters: None.
   */
  async clearFilters(): Promise<void> {
    await this.selectLocation('All Items');
    await this.clearItemSearch();

    log('✓ Cleared Monthly Count filters');
  }

  /**
   * Clear the item search text on the Monthly Count details page.
   * Verifies: the search box is empty after the clear action.
   * Parameters: None.
   */
  async clearItemSearch(): Promise<void> {
    const clearSearchButton = this.getClearSearchButton();

    if (await clearSearchButton.isVisible()) {
      await clearSearchButton.click();
    }

    await expect(this.itemSearchInput).toHaveValue('');

    log('✓ Cleared Monthly Count item search');
  }

  /**
   * Validate the filtered empty-state message when no Monthly Count items match the active filters.
   * Verifies: the no-results message is visible.
   * Parameters: None.
   */
  async verifyNoItemsMatchFiltersMessageVisible(): Promise<void> {
    await expect(this.noItemsMatchFiltersMessage).toBeVisible();

    log('✓ Verified: No-items-match-filters message is displayed');
  }

  /**
   * Validate that a specific Monthly Count item row is present in the details table.
   * Verifies: a row matching the supplied item name or SKU is visible.
   * @param itemNameOrSku Item name or SKU fragment used to locate the row.
   */
  async verifyItemRowVisible(itemNameOrSku: string): Promise<void> {
    await expect(this.getItemRow(itemNameOrSku).first()).toBeVisible();

    log(`✓ Verified: Monthly Count item row is visible for "${itemNameOrSku}"`);
  }

  /**
   * Open the Add Item dialog from the Monthly Count details page.
   * Verifies: the trigger is available before click, then the add-item dialog becomes visible.
   * Parameters: None.
   */
  async openAddItemDialog(): Promise<void> {
    log('Opening Add Item dialog for Monthly Count');

    await expect(this.addItemButton).toBeEnabled();
    await this.addItemButton.click();
    await this.verifyAddItemDialogVisible();

    log('✓ Opened Add Item dialog for Monthly Count');
  }

  /**
   * Validate the Add Item dialog contents for Monthly Count.
   * Verifies: dialog title, search field, location picker trigger, cancel action, and disabled submit state.
   * Parameters: None.
   */
  async verifyAddItemDialogVisible(): Promise<void> {
    await expect(this.addItemDialogTitle).toBeVisible();
    await expect(this.addItemSearchInput).toBeVisible();
    await expect(this.selectLocationsButton).toBeVisible();
    await expect(this.cancelAddItemButton).toBeVisible();
    await expect(this.confirmAddItemButton).toBeVisible();
    await expect(this.confirmAddItemButton).toBeDisabled();

    log('✓ Verified: Add Item dialog is displayed for Monthly Count');
  }

  /**
   * Search available items inside the Monthly Count Add Item dialog.
   * Verifies: the search field contains the provided value.
   * @param searchTerm Item name or PLU text to search in the add-item dialog.
   */
  async searchAvailableItem(searchTerm: string): Promise<void> {
    log(`Searching add-item catalog for Monthly Count item: ${searchTerm}`);

    await this.addItemSearchInput.fill(searchTerm);
    await expect(this.addItemSearchInput).toHaveValue(searchTerm);

    log(`✓ Searched add-item catalog for Monthly Count item: ${searchTerm}`);
  }

  /**
   * Validate the add-item no-results state for Monthly Count.
   * Verifies: the expected no-active-items message is visible for the supplied search term.
   * @param searchTerm Search term that should produce no active item matches.
   */
  async verifyNoActiveItemsMatchMessageVisible(searchTerm: string): Promise<void> {
    await expect(
      this.page.getByText(`No active items match "${searchTerm}".`, {
        exact: true,
      }),
    ).toBeVisible();

    log(`✓ Verified: No active add-item matches are shown for "${searchTerm}"`);
  }

  /**
   * Open the location picker within the Monthly Count Add Item dialog.
   * Verifies: the picker opens and a known location option becomes visible.
   * Parameters: None.
   */
  async openLocationPicker(): Promise<void> {
    log('Opening Monthly Count add-item location picker');

    await this.selectLocationsButton.click();
    await expect(this.getLocationPickerOption('Walk-In Cooler')).toBeVisible();

    log('✓ Opened Monthly Count add-item location picker');
  }

  /**
   * Select a location from the Monthly Count Add Item location picker.
   * Verifies: the requested location option is visible and clicked.
   * @param locationName Exact location name to select from the picker.
   */
  async selectAddItemLocation(locationName: string): Promise<void> {
    log(`Selecting Monthly Count add-item location: ${locationName}`);

    const locationOption = this.getLocationPickerOption(locationName);
    await expect(locationOption).toBeVisible();
    await locationOption.click();

    log(`✓ Selected Monthly Count add-item location: ${locationName}`);
  }

  /**
   * Dismiss the Monthly Count Add Item dialog.
   * Verifies: any open picker overlay is closed first, then the dialog is cancelled.
   * Parameters: None.
   */
  async cancelAddItem(): Promise<void> {
    log('Cancelling Monthly Count Add Item dialog');

    await this.page.keyboard.press('Escape');
    try {
      await this.cancelAddItemButton.click({ timeout: 2000 });
    } catch {
      await this.getCloseDialogButton().click();
    }
    await expect(this.addItemDialogTitle).toBeHidden();

    log('✓ Cancelled Monthly Count Add Item dialog');
  }

  /**
   * Delete the currently opened Monthly Count from the details page.
   * Verifies: the native confirm dialog is handled and navigation occurs only when accepted.
   * @param acceptDelete Whether to accept the native delete confirmation. Defaults to `true`.
   */
  async deleteCurrentMonthlyCount(acceptDelete = true): Promise<void> {
    log('Deleting the currently opened Monthly Count');

    await expect(this.deleteButton).toBeVisible();
    await this.prepareForDialogResponse(acceptDelete);
    await this.deleteButton.click();

    if (acceptDelete) {
      await expect(this.page).toHaveURL(/\/counts\/monthly$/);
      log('✓ Deleted the current Monthly Count');
      return;
    }

    await expect(this.page).toHaveURL(/\/counts\/monthly\/\d+$/);
    log('✓ Dismissed delete confirmation for the current Monthly Count');
  }

  /**
   * Delete a Monthly Count item row from the details table.
   * Verifies: the native confirm dialog is handled and the row is removed only when accepted.
   * @param itemNameOrSku Item name or SKU fragment used to locate the row.
   * @param acceptDelete Whether to accept the native delete confirmation. Defaults to `true`.
   */
  async deleteItem(itemNameOrSku: string, acceptDelete = true): Promise<void> {
    log(`Deleting Monthly Count item "${itemNameOrSku}"`);

    const itemRow = this.getItemRow(itemNameOrSku).first();
    const deleteItemButton = this.getItemDeleteButton(itemNameOrSku).first();

    await expect(itemRow).toBeVisible();
    await this.prepareForDialogResponse(acceptDelete);
    await deleteItemButton.click();

    if (acceptDelete) {
      await expect(itemRow).toBeHidden();
      log(`✓ Deleted Monthly Count item "${itemNameOrSku}"`);
      return;
    }

    await expect(itemRow).toBeVisible();
    log(`✓ Dismissed delete confirmation for Monthly Count item "${itemNameOrSku}"`);
  }

  /**
   * Validate a visible Monthly Count validation or informational message.
   * Verifies: the supplied message text is visible on the page.
   * @param message Exact message text expected in the UI.
   */
  async verifyValidationMessage(message: string): Promise<void> {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible();

    log(`✓ Verified validation message: ${message}`);
  }
}
