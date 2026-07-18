import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export type WeeklyCountShift = 'AM' | 'Mid-Shift' | 'PM';
export type WeeklyCountUnit = 'cs' | 'pk' | 'ea';

export class WeeklyCountPage {
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly newWeeklyCountButton: Locator;
  readonly weeklyCountTable: Locator;
  readonly countIdHeader: Locator;
  readonly nameHeader: Locator;
  readonly timingHeader: Locator;
  readonly statusHeader: Locator;
  readonly timeCreatedHeader: Locator;
  readonly createWeeklyCountDialogTitle: Locator;
  readonly startWeeklyCountButton: Locator;
  readonly cancelCreateWeeklyCountButton: Locator;
  readonly detailHeading: Locator;
  readonly detailCreatedAtText: Locator;
  readonly saveCountsButton: Locator;
  readonly lockCountButton: Locator;
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
  readonly noItemsMatchFiltersMessage: Locator;
  readonly exportDialogTitle: Locator;
  readonly printButton: Locator;
  readonly saveAsCsvButton: Locator;
  readonly addItemDialogTitle: Locator;
  readonly addItemSearchInput: Locator;
  readonly selectLocationsButton: Locator;
  readonly cancelAddItemButton: Locator;
  readonly confirmAddItemButton: Locator;

  constructor(private readonly page: Page) {
    this.pageTitle = page.getByRole('heading', { name: 'Weekly Count' });
    this.pageDescription = page.getByText(
      'Weekly full inventory counts for all store items',
      { exact: true },
    );
    this.newWeeklyCountButton = page.getByRole('button', {
      name: /new weekly count/i,
    });
    this.weeklyCountTable = page.getByRole('table').first();
    this.countIdHeader = page.getByRole('columnheader', { name: 'Count ID' });
    this.nameHeader = page.getByRole('columnheader', { name: 'Name' });
    this.timingHeader = page.getByRole('columnheader', { name: 'Timing' });
    this.statusHeader = page.getByRole('columnheader', { name: 'Status' });
    this.timeCreatedHeader = page.getByRole('columnheader', {
      name: 'Time Created',
    });
    this.createWeeklyCountDialogTitle = page.getByText('New Weekly Count', {
      exact: true,
    });
    this.startWeeklyCountButton = page.getByRole('button', {
      name: 'Start Weekly Count',
    });
    this.cancelCreateWeeklyCountButton = page.getByRole('button', {
      name: 'Cancel',
    });
    this.detailHeading = page.getByRole('heading', { name: /Weekly Count/i });
    this.detailCreatedAtText = page.getByText(/Created at:/i);
    this.saveCountsButton = page.getByRole('button', { name: 'Save Counts' });
    this.lockCountButton = page.getByRole('button', { name: 'Lock Count' });
    this.exportButton = page.getByRole('button', { name: 'Export' });
    this.addItemButton = page.getByRole('button', { name: /^Add Item$/ });
    this.deleteButton = page.getByRole('button', { name: 'Delete' });
    this.totalItemsCardLabel = page.getByText('Total Items', { exact: true });
    this.countedItemsCardLabel = page.getByText('Counted', { exact: true });
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
    this.noItemsMatchFiltersMessage = page.getByText(
      'No items match these filters.',
      { exact: true },
    );
    this.exportDialogTitle = page.getByText('Export Count', { exact: true });
    this.printButton = page.getByRole('button', { name: 'Print' });
    this.saveAsCsvButton = page.getByRole('button', { name: 'Save as CSV' });
    this.addItemDialogTitle = page.getByText('Add Item to Weekly Count', {
      exact: true,
    });
    this.addItemSearchInput = page.getByPlaceholder(/Search by name or PLU/i);
    this.selectLocationsButton = page.getByRole('button', {
      name: /select locations/i,
    });
    this.cancelAddItemButton = page.getByRole('button', { name: 'Cancel' });
    this.confirmAddItemButton = page.getByRole('button', {
      name: /^Add Item$/,
    });
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getCountRow(identifier: string): Locator {
    return this.weeklyCountTable.getByRole('row', {
      name: new RegExp(this.escapeRegExp(identifier), 'i'),
    });
  }

  private getCreateDialogTextboxes(): Locator {
    return this.page.getByRole('textbox');
  }

  private getShiftDateInput(): Locator {
    return this.getCreateDialogTextboxes().nth(0);
  }

  private getWeeklyCountNameInput(): Locator {
    return this.getCreateDialogTextboxes().nth(1);
  }

  private getShiftTriggerButton(): Locator {
    return this.page.getByRole('button', { name: /^(AM|Mid-Shift|PM)$/i }).first();
  }

  private getShiftOptionButton(shift: WeeklyCountShift): Locator {
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
   * Wait for the Weekly Count listing page to finish loading.
   * Verifies: the listing URL, page title, and main table are visible.
   * Parameters: None.
   */
  async waitForWeeklyCountPageToLoad(): Promise<void> {
    await expect(this.page).toHaveURL(/\/counts\/weekly$/);
    await expect(this.pageTitle).toBeVisible();
    await expect(this.weeklyCountTable).toBeVisible();
  }

  /**
   * Wait for a Weekly Count details page to finish loading.
   * Verifies: the details URL, detail heading, and item table are visible.
   * Parameters: None.
   */
  async waitForWeeklyCountDetailsToLoad(): Promise<void> {
    await expect(this.page).toHaveURL(/\/counts\/weekly\/\d+$/);
    await expect(this.detailHeading).toBeVisible();
    await expect(this.itemTable).toBeVisible();
  }

  /**
   * Validate that the Weekly Count listing page is fully rendered.
   * Verifies: page load state, description text, new-count action, and table headers.
   * Parameters: None.
   */
  async verifyWeeklyCountPageLoaded(): Promise<void> {
    await this.waitForWeeklyCountPageToLoad();
    await expect(this.pageDescription).toBeVisible();
    await this.verifyNewWeeklyCountButtonEnabled();
    await this.verifyWeeklyCountTableHeaders();

    log('✓ Verified: Weekly Count page is displayed');
  }

  /**
   * Validate that the New Weekly Count primary action is available.
   * Verifies: the button is visible and enabled.
   * Parameters: None.
   */
  async verifyNewWeeklyCountButtonEnabled(): Promise<void> {
    await expect(this.newWeeklyCountButton).toBeVisible();
    await expect(this.newWeeklyCountButton).toBeEnabled();

    log('✓ Verified: + NEW WEEKLY COUNT button is enabled');
  }

  /**
   * Validate the column structure of the Weekly Count listing grid.
   * Verifies: Count ID, Name, Timing, Status, and Time Created headers are visible.
   * Parameters: None.
   */
  async verifyWeeklyCountTableHeaders(): Promise<void> {
    await expect(this.countIdHeader).toBeVisible();
    await expect(this.nameHeader).toBeVisible();
    await expect(this.timingHeader).toBeVisible();
    await expect(this.statusHeader).toBeVisible();
    await expect(this.timeCreatedHeader).toBeVisible();

    log('✓ Verified: Weekly Count table headers are visible');
  }

  /**
   * Validate that a specific Weekly Count row is present on the listing page.
   * Verifies: a row matching the supplied identifier is visible.
   * @param identifier Row text, count ID, or unique name fragment used to locate the Weekly Count.
   */
  async verifyWeeklyCountExists(identifier: string): Promise<void> {
    await expect(this.getCountRow(identifier)).toBeVisible();

    log(`✓ Verified: Weekly Count "${identifier}" is visible in the listing`);
  }

  /**
   * Open the New Weekly Count creation dialog.
   * Verifies: the trigger is enabled before click, then the creation dialog becomes visible.
   * Parameters: None.
   */
  async clickNewWeeklyCountButton(): Promise<void> {
    log('Clicking on + NEW WEEKLY COUNT button');

    await expect(this.newWeeklyCountButton).toBeEnabled();
    await this.newWeeklyCountButton.click();
    await this.verifyNewWeeklyCountDialogVisible();

    log('✓ Clicked on + NEW WEEKLY COUNT button');
  }

  /**
   * Validate the New Weekly Count dialog contents.
   * Verifies: dialog title, shift selector, shift date field, name field, and start button state.
   * Parameters: None.
   */
  async verifyNewWeeklyCountDialogVisible(): Promise<void> {
    await expect(this.createWeeklyCountDialogTitle).toBeVisible();
    await expect(this.getShiftTriggerButton()).toBeVisible();
    await expect(this.getShiftDateInput()).toBeVisible();
    await expect(this.getWeeklyCountNameInput()).toBeVisible();
    await expect(this.startWeeklyCountButton).toBeVisible();
    await expect(this.startWeeklyCountButton).toBeEnabled();

    log('✓ Verified: New Weekly Count dialog is displayed');
  }

  /**
   * Choose the shift used for Weekly Count creation.
   * Verifies: the requested shift value is shown on the selector after the update.
   * @param shift Shift option to select: `AM`, `Mid-Shift`, or `PM`.
   */
  async selectShift(shift: WeeklyCountShift): Promise<void> {
    log(`Selecting "${shift}" shift for Weekly Count`);

    await this.getShiftTriggerButton().click();
    await this.getShiftOptionButton(shift).click();
    await expect(this.page.getByRole('button', { name: new RegExp(`^${this.escapeRegExp(shift)}$`, 'i') }).first()).toBeVisible();

    log(`✓ Selected "${shift}" shift for Weekly Count`);
  }

  /**
   * Update the Weekly Count shift date in the creation dialog.
   * Verifies: the shift date input contains the supplied value after fill.
   * @param shiftDate Date string to enter into the shift date field.
   */
  async fillShiftDate(shiftDate: string): Promise<void> {
    log(`Updating Weekly Count shift date to "${shiftDate}"`);

    await this.getShiftDateInput().fill(shiftDate);
    await expect(this.getShiftDateInput()).toHaveValue(shiftDate);

    log('✓ Weekly Count shift date updated successfully');
  }

  /**
   * Update the Weekly Count name in the creation dialog.
   * Verifies: the name input contains the supplied value after fill.
   * @param name Name to enter for the new Weekly Count.
   */
  async fillWeeklyCountName(name: string): Promise<void> {
    log(`Updating Weekly Count name to "${name}"`);

    await this.getWeeklyCountNameInput().fill(name);
    await expect(this.getWeeklyCountNameInput()).toHaveValue(name);

    log('✓ Weekly Count name updated successfully');
  }

  /**
   * Submit the New Weekly Count dialog.
   * Verifies: the start button is enabled before click and the details page finishes loading.
   * Parameters: None.
   */
  async clickStartWeeklyCountButton(): Promise<void> {
    log('Clicking on Start Weekly Count button');

    await expect(this.startWeeklyCountButton).toBeEnabled();
    await this.startWeeklyCountButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.waitForWeeklyCountDetailsToLoad();

    log('✓ Weekly Count details page loaded successfully');
  }

  /**
   * Execute the complete Weekly Count creation flow.
   * Verifies: the creation dialog opens, optional field updates persist, and the details page loads after submission.
   * @param shift Shift option to use for the new count. Defaults to `AM`.
   * @param options Optional overrides for shift date and generated count name.
   */
  async startWeeklyCount(
    shift: WeeklyCountShift = 'AM',
    options?: {
      shiftDate?: string;
      name?: string;
    },
  ): Promise<void> {
    await this.clickNewWeeklyCountButton();

    if (shift !== 'AM') {
      await this.selectShift(shift);
    }

    if (options?.shiftDate) {
      await this.fillShiftDate(options.shiftDate);
    }

    if (options?.name) {
      await this.fillWeeklyCountName(options.name);
    }

    await this.clickStartWeeklyCountButton();
  }

  /**
   * Cancel Weekly Count creation from the dialog.
   * Verifies: the dialog closes and control returns to the Weekly Count listing page.
   * Parameters: None.
   */
  async cancelNewWeeklyCount(): Promise<void> {
    log('Cancelling Weekly Count creation');

    await this.cancelCreateWeeklyCountButton.click();
    await this.waitForWeeklyCountPageToLoad();

    log('✓ Weekly Count creation dialog closed successfully');
  }

  /**
   * Close the currently visible modal dialog on the Weekly Count surface.
   * Verifies: the close action is triggered and the UI gets a short settle wait.
   * Parameters: None.
   */
  async closeActiveDialog(): Promise<void> {
    log('Closing active Weekly Count dialog');

    await this.getCloseDialogButton().click();
    await this.page.waitForTimeout(300);

    log('✓ Active dialog closed successfully');
  }

  /**
   * Open a specific Weekly Count from the listing page.
   * Verifies: the matching row can be clicked and the details page loads successfully.
   * @param identifier Row text, count ID, or unique name fragment used to locate the Weekly Count.
   */
  async openWeeklyCount(identifier: string): Promise<void> {
    log(`Opening Weekly Count "${identifier}" from listing page`);

    await this.getCountRow(identifier).click();
    await this.page.waitForLoadState('networkidle');
    await this.waitForWeeklyCountDetailsToLoad();

    log(`✓ Weekly Count "${identifier}" opened successfully`);
  }

  /**
   * Open the first Weekly Count row in the listing grid.
   * Verifies: the first data row is clickable and the details page loads successfully.
   * Parameters: None.
   */
  async openFirstWeeklyCount(): Promise<void> {
    log('Opening first Weekly Count from listing page');

    await this.weeklyCountTable.getByRole('row').nth(1).click();
    await this.page.waitForLoadState('networkidle');
    await this.waitForWeeklyCountDetailsToLoad();

    log('✓ First Weekly Count opened successfully');
  }

  /**
   * Delete or dismiss deletion for a Weekly Count directly from the listing page.
   * Verifies: the row-level delete action is triggered and the native confirm dialog is handled.
   * @param identifier Row text, count ID, or unique name fragment used to locate the Weekly Count.
   * @param acceptDelete When `true`, accepts the browser confirm dialog; when `false`, dismisses it.
   */
  async deleteWeeklyCountFromList(
    identifier: string,
    acceptDelete: boolean = true,
  ): Promise<void> {
    log(`Triggering delete action for Weekly Count "${identifier}"`);

    await this.prepareForDialogResponse(acceptDelete);
    await this.getCountRow(identifier)
      .getByRole('button', { name: /delete count/i })
      .click();
    await this.page.waitForLoadState('networkidle');

    log(
      `✓ Weekly Count delete action handled for "${identifier}" (${acceptDelete ? 'confirmed' : 'dismissed'})`,
    );
  }

  /**
   * Validate that a Weekly Count details screen is fully rendered.
   * Verifies: details page load state, created-at text, action bar, summary cards, location filters, search field, and item table headers.
   * Parameters: None.
   */
  async verifyWeeklyCountDetailsPageLoaded(): Promise<void> {
    await this.waitForWeeklyCountDetailsToLoad();
    await expect(this.detailCreatedAtText).toBeVisible();
    await this.verifyDetailActionButtonsVisible();
    await this.verifySummaryCardsVisible();
    await this.verifyItemTableHeaders();
    await expect(this.locationsHeading).toBeVisible();
    await expect(this.allItemsLocationButton).toBeVisible();
    await expect(this.itemSearchInput).toBeVisible();

    log('✓ Verified: Weekly Count details page is displayed');
  }

  /**
   * Validate the main action bar on the Weekly Count details page.
   * Verifies: Save Counts, Export, Add Item, and Delete actions are visible.
   * Parameters: None.
   */
  async verifyDetailActionButtonsVisible(): Promise<void> {
    await expect(this.saveCountsButton).toBeVisible();
    await expect(this.exportButton).toBeVisible();
    await expect(this.addItemButton.first()).toBeVisible();
    await expect(this.deleteButton).toBeVisible();

    log('✓ Verified: Weekly Count detail action buttons are visible');
  }

  /**
   * Validate the lock-count action state.
   * Verifies: the Lock Count button is disabled in the current page state.
   * Parameters: None.
   */
  async verifyLockCountDisabled(): Promise<void> {
    await expect(this.lockCountButton).toBeDisabled();

    log('✓ Verified: Lock Count button is disabled');
  }

  /**
   * Validate the dashboard cards shown on the Weekly Count details page.
   * Verifies: Total Items, Counted, Remaining, and Flagged summary cards are visible.
   * Parameters: None.
   */
  async verifySummaryCardsVisible(): Promise<void> {
    await expect(this.totalItemsCardLabel).toBeVisible();
    await expect(this.countedItemsCardLabel).toBeVisible();
    await expect(this.remainingItemsCardLabel).toBeVisible();
    await expect(this.flaggedItemsCardLabel).toBeVisible();

    log('✓ Verified: Weekly Count summary cards are visible');
  }

  /**
   * Validate the column structure of the item table on the details page.
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

    log('✓ Verified: Weekly Count item table headers are visible');
  }

  /**
   * Apply a location filter on the Weekly Count details page.
   * Verifies: the requested location chip/button is clickable and remains visible after selection.
   * @param locationName Visible location name to select, such as `All Items` or `Walk-In Cooler`.
   */
  async selectLocation(locationName: string): Promise<void> {
    log(`Selecting Weekly Count location filter "${locationName}"`);

    await this.getLocationButton(locationName).click();
    await expect(this.getLocationButton(locationName)).toBeVisible();

    log(`✓ Weekly Count location filter "${locationName}" selected successfully`);
  }

  /**
   * Apply the common Weekly Count filter combination used in tests.
   * Verifies: the selected location is applied, and optionally the item search field is updated.
   * @param locationName Visible location name to select.
   * @param searchTerm Optional item name or SKU text to apply to the search field.
   */
  async applyFilters(locationName: string, searchTerm?: string): Promise<void> {
    await this.selectLocation(locationName);

    if (searchTerm) {
      await this.searchItem(searchTerm);
    }
  }

  /**
   * Search within the Weekly Count item grid.
   * Verifies: the details search field contains the provided item name or SKU text.
   * @param itemNameOrSku Item name, partial text, or SKU used to filter the grid.
   */
  async searchItem(itemNameOrSku: string): Promise<void> {
    log(`Searching Weekly Count items for "${itemNameOrSku}"`);

    await this.itemSearchInput.fill(itemNameOrSku);
    await expect(this.itemSearchInput).toHaveValue(itemNameOrSku);

    log(`✓ Weekly Count items filtered by "${itemNameOrSku}"`);
  }

  /**
   * Reset the most common Weekly Count filters back to their default state.
   * Verifies: the `All Items` location is selected and the search field is cleared when applicable.
   * Parameters: None.
   */
  async clearFilters(): Promise<void> {
    log('Clearing Weekly Count filters');

    await this.selectLocation('All Items');
    await this.clearItemSearch();

    log('✓ Weekly Count filters cleared successfully');
  }

  /**
   * Clear the Weekly Count item search field when the clear action is present.
   * Verifies: the search field becomes empty after the clear action is used.
   * Parameters: None.
   */
  async clearItemSearch(): Promise<void> {
    const clearSearchButton = this.getClearSearchButton();
    const clearButtonVisible = await clearSearchButton.isVisible().catch(() => false);

    if (!clearButtonVisible) {
      return;
    }

    log('Clearing Weekly Count item search');

    await clearSearchButton.click();
    await expect(this.itemSearchInput).toHaveValue('');

    log('✓ Weekly Count item search cleared successfully');
  }

  /**
   * Validate the empty-state message for the details grid.
   * Verifies: the `No items match these filters.` message is visible.
   * Parameters: None.
   */
  async verifyNoItemsMatchFiltersMessageVisible(): Promise<void> {
    await expect(this.noItemsMatchFiltersMessage).toBeVisible();

    log('✓ Verified: Weekly Count empty-state filter message is visible');
  }

  /**
   * Validate that a specific item row is present in the details grid.
   * Verifies: a row matching the supplied item name or SKU is visible.
   * @param itemNameOrSku Item name, partial text, or SKU used to locate the row.
   */
  async verifyItemRowVisible(itemNameOrSku: string): Promise<void> {
    await expect(this.getItemRow(itemNameOrSku)).toBeVisible();

    log(`✓ Verified: Weekly Count item row is visible for "${itemNameOrSku}"`);
  }

  /**
   * Validate the status shown for a specific item row.
   * Verifies: the supplied status label is visible within the matching item row.
   * @param itemNameOrSku Item name, partial text, or SKU used to locate the row.
   * @param status Expected item status label.
   */
  async verifyItemStatus(
    itemNameOrSku: string,
    status: 'Counted' | 'Pending' | 'Flagged',
  ): Promise<void> {
    await expect(
      this.getItemRow(itemNameOrSku).getByText(status, { exact: true }),
    ).toBeVisible();

    log(`✓ Verified: "${itemNameOrSku}" is marked as "${status}"`);
  }

  /**
   * Update one unit field for a specific item in the details grid.
   * Verifies: the targeted `cs`, `pk`, or `ea` spinbutton contains the supplied value after fill.
   * @param itemNameOrSku Item name, partial text, or SKU used to locate the row.
   * @param unit Unit field to update: `cs`, `pk`, or `ea`.
   * @param value Numeric text to enter into the selected unit input.
   */
  async updateItemCount(
    itemNameOrSku: string,
    unit: WeeklyCountUnit,
    value: string,
  ): Promise<void> {
    const unitIndexMap: Record<WeeklyCountUnit, number> = {
      cs: 0,
      pk: 1,
      ea: 2,
    };
    const unitInput = this.getItemRow(itemNameOrSku)
      .getByRole('spinbutton')
      .nth(unitIndexMap[unit]);

    log(`Updating "${itemNameOrSku}" ${unit} count to "${value}"`);

    await unitInput.fill(value);
    await expect(unitInput).toHaveValue(value);

    log(`✓ Updated "${itemNameOrSku}" ${unit} count successfully`);
  }

  /**
   * Persist edited item counts from the details page.
   * Verifies: the save action is triggered and the page reaches network idle afterward.
   * Parameters: None.
   */
  async saveCounts(): Promise<void> {
    log('Saving Weekly Count item values');

    await this.saveCountsButton.click();
    await this.page.waitForLoadState('networkidle');

    log('✓ Weekly Count save action completed');
  }

  /**
   * Open the Weekly Count export dialog.
   * Verifies: the export action opens a dialog containing print and CSV actions.
   * Parameters: None.
   */
  async openExportDialog(): Promise<void> {
    log('Opening Weekly Count export dialog');

    await this.exportButton.click();
    await this.verifyExportDialogVisible();

    log('✓ Weekly Count export dialog opened successfully');
  }

  /**
   * Validate the export dialog contents.
   * Verifies: the dialog title plus Print and Save as CSV actions are visible.
   * Parameters: None.
   */
  async verifyExportDialogVisible(): Promise<void> {
    await expect(this.exportDialogTitle).toBeVisible();
    await expect(this.printButton).toBeVisible();
    await expect(this.saveAsCsvButton).toBeVisible();

    log('✓ Verified: Weekly Count export dialog is visible');
  }

  /**
   * Trigger the print action from the Weekly Count export dialog.
   * Verifies: the print button is clicked; downstream browser print handling is left to the caller/environment.
   * Parameters: None.
   */
  async printWeeklyCount(): Promise<void> {
    log('Clicking Weekly Count Print action');

    await this.printButton.click();

    log('✓ Weekly Count Print action triggered successfully');
  }

  /**
   * Trigger the CSV export action from the Weekly Count export dialog.
   * Verifies: the Save as CSV button is clicked; downstream download handling is left to the caller/environment.
   * Parameters: None.
   */
  async exportWeeklyCountAsCsv(): Promise<void> {
    log('Clicking Weekly Count Save as CSV action');

    await this.saveAsCsvButton.click();

    log('✓ Weekly Count Save as CSV action triggered successfully');
  }

  /**
   * Open the Add Item dialog from a Weekly Count details page.
   * Verifies: the Add Item action opens the dialog and its core controls are visible.
   * Parameters: None.
   */
  async openAddItemDialog(): Promise<void> {
    log('Opening Add Item dialog for Weekly Count');

    await this.addItemButton.first().click();
    await this.verifyAddItemDialogVisible();

    log('✓ Add Item dialog opened successfully');
  }

  /**
   * Validate the Add Item dialog contents.
   * Verifies: the dialog title, search input, location selector, and disabled submit state are visible.
   * Parameters: None.
   */
  async verifyAddItemDialogVisible(): Promise<void> {
    await expect(this.addItemDialogTitle).toBeVisible();
    await expect(this.addItemSearchInput).toBeVisible();
    await expect(this.selectLocationsButton).toBeVisible();
    await expect(this.confirmAddItemButton.last()).toBeDisabled();

    log('✓ Verified: Add Item dialog is visible');
  }

  /**
   * Search for an inventory item inside the Add Item dialog.
   * Verifies: the dialog search input contains the supplied term after fill.
   * @param searchTerm Item name or PLU text used to filter addable items.
   */
  async searchAvailableItem(searchTerm: string): Promise<void> {
    log(`Searching available items for Weekly Count with term "${searchTerm}"`);

    await this.addItemSearchInput.fill(searchTerm);
    await expect(this.addItemSearchInput).toHaveValue(searchTerm);

    log(`✓ Weekly Count Add Item search updated with "${searchTerm}"`);
  }

  /**
   * Validate the no-results message shown in the Add Item dialog.
   * Verifies: the dynamic `No active items match` message is visible for the supplied search term.
   * @param searchTerm Search term expected inside the no-results validation message.
   */
  async verifyNoActiveItemsMatchMessageVisible(searchTerm: string): Promise<void> {
    await expect(
      this.page.getByText(
        new RegExp(
          `^No active items match "${this.escapeRegExp(searchTerm)}"\\.$`,
          'i',
        ),
      ),
    ).toBeVisible();

    log(`✓ Verified: No active items match validation is visible for "${searchTerm}"`);
  }

  /**
   * Open the location picker within the Add Item dialog.
   * Verifies: the location picker trigger is clicked so location options can be selected.
   * Parameters: None.
   */
  async openLocationPicker(): Promise<void> {
    log('Opening Weekly Count Add Item location picker');

    await this.selectLocationsButton.click();

    log('✓ Weekly Count Add Item location picker opened successfully');
  }

  /**
   * Select a location from the Add Item dialog picker.
   * Verifies: the requested location option is clicked successfully.
   * @param locationName Exact location option to choose from the picker.
   */
  async selectAddItemLocation(locationName: string): Promise<void> {
    log(`Selecting Add Item location "${locationName}" for Weekly Count`);

    await this.getLocationPickerOption(locationName).click();

    log(`✓ Weekly Count Add Item location "${locationName}" selected successfully`);
  }

  /**
   * Cancel the Add Item workflow.
   * Verifies: the cancel action is triggered and the dialog is given time to close.
   * Parameters: None.
   */
  async cancelAddItem(): Promise<void> {
    log('Cancelling Add Item workflow for Weekly Count');

    await this.cancelAddItemButton.click();
    await this.page.waitForTimeout(300);

    log('✓ Add Item dialog cancelled successfully');
  }

  /**
   * Delete or dismiss deletion for the currently opened Weekly Count details page.
   * Verifies: the page-level delete action is triggered and the native confirm dialog is handled.
   * @param acceptDelete When `true`, accepts the browser confirm dialog; when `false`, dismisses it.
   */
  async deleteCurrentWeeklyCount(acceptDelete: boolean = true): Promise<void> {
    log('Triggering delete action for the current Weekly Count');

    await this.prepareForDialogResponse(acceptDelete);
    await this.deleteButton.click();
    await this.page.waitForLoadState('networkidle');

    log(
      `✓ Current Weekly Count delete action handled successfully (${acceptDelete ? 'confirmed' : 'dismissed'})`,
    );
  }

  /**
   * Delete or dismiss deletion for a specific item inside the Weekly Count details grid.
   * Verifies: the item-level delete action is triggered and the native confirm dialog is handled.
   * @param itemNameOrSku Item name, partial text, or SKU used to locate the delete action.
   * @param acceptDelete When `true`, accepts the browser confirm dialog; when `false`, dismisses it.
   */
  async deleteItem(
    itemNameOrSku: string,
    acceptDelete: boolean = true,
  ): Promise<void> {
    log(`Triggering delete action for Weekly Count item "${itemNameOrSku}"`);

    await this.prepareForDialogResponse(acceptDelete);
    await this.getItemDeleteButton(itemNameOrSku).click();
    await this.page.waitForLoadState('networkidle');

    log(
      `✓ Weekly Count item delete action handled for "${itemNameOrSku}" (${acceptDelete ? 'confirmed' : 'dismissed'})`,
    );
  }

  /**
   * Validate a generic message on the current Weekly Count surface.
   * Verifies: the exact text supplied by the caller is visible on the page.
   * @param message Exact validation or informational text expected on the page.
   */
  async verifyValidationMessage(message: string): Promise<void> {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible();

    log(`✓ Verified: Validation message is visible - "${message}"`);
  }
}
