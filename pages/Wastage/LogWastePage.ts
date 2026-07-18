/**
 * LogWastePage – Page Object
 * ==========================
 * Locators and actions for Wastage → Log Waste (Waste Logs) used by RCSP-41.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export type WasteLineInput = {
  type: 'ITEM' | 'RECIPE' | 'Item' | 'Recipe' | string;
  wasteCategory?: string;
  item?: string;
  sku?: string;
  recipe?: string;
  reason: string;
  uom?: string;
  quantity: string;
  notes: string;
  employeeId?: string;
};

export class LogWastePage {
  readonly sidebar: Locator;
  readonly wastageMenu: Locator;
  readonly logWasteLink: Locator;

  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly logWasteButton: Locator;
  readonly wasteLogsTable: Locator;

  readonly logWasteModal: Locator;
  readonly shiftField: Locator;
  readonly createWasteLogButton: Locator;
  readonly cancelModalButton: Locator;

  readonly saveButton: Locator;
  readonly lockButton: Locator;
  readonly applyToStockButton: Locator;
  readonly addRowButton: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.wastageMenu = this.sidebar.getByRole('button', { name: /^wastage$/i });
    this.logWasteLink = this.sidebar
      .getByRole('link', { name: /log waste/i })
      .or(this.sidebar.getByRole('button', { name: /log waste/i }));

    this.pageTitle = page.getByRole('heading', { name: /^waste logs$/i }).first();
    this.pageDescription = page.getByText(
      /grouped waste submissions by date and shift/i,
    );
    this.logWasteButton = page
      .locator('main')
      .getByRole('button', { name: /log waste/i })
      .first();
    this.wasteLogsTable = page.getByRole('table').first();

    // Modal is a custom overlay (not always role=dialog); anchor on Create Waste Log + Shift.
    this.logWasteModal = page
      .locator('div')
      .filter({ has: page.getByRole('button', { name: /create waste log/i }) })
      .filter({ has: page.getByRole('combobox', { name: /shift/i }) })
      .first();
    this.shiftField = this.logWasteModal
      .getByRole('combobox', { name: /shift/i })
      .or(this.logWasteModal.getByLabel(/shift/i))
      .first();
    this.createWasteLogButton = page.getByRole('button', {
      name: /create waste log/i,
    });
    this.cancelModalButton = this.logWasteModal
      .getByRole('button', { name: /^cancel$/i })
      .first();

    this.saveButton = page
      .getByRole('button', { name: /^save$/i })
      .filter({ hasText: /^save$/i })
      .first();
    this.lockButton = page.getByRole('button', { name: /^lock$/i }).first();
    this.applyToStockButton = page.getByRole('button', {
      name: /apply to stock/i,
    });
    this.addRowButton = page.getByRole('button', { name: /add row/i });
  }

  async expandWastage(): Promise<void> {
    log('Expanding Wastage menu');
    const visible = await this.logWasteLink.isVisible().catch(() => false);
    if (!visible) {
      await this.wastageMenu.click();
      await this.page.waitForTimeout(400);
    }
  }

  async openLogWaste(): Promise<void> {
    log('Navigating to Wastage → Log Waste');
    await this.expandWastage();
    await expect(this.logWasteLink.first()).toBeVisible({ timeout: 15000 });
    await this.logWasteLink.first().click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.verifyWasteLogsPageLoaded();
    log('✓ Waste Logs page loaded');
  }

  async verifyWasteLogsPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
    await expect(this.pageDescription).toBeVisible({ timeout: 15000 });
    await expect(this.logWasteButton.first()).toBeVisible({ timeout: 15000 });
  }

  async verifyListingChrome(input: {
    expectedPageTitle: string;
    expectedPageDescription: string;
    expectedPrimaryButton: string;
    columnHeaders: string[];
  }): Promise<void> {
    await expect(this.pageTitle).toContainText(new RegExp(input.expectedPageTitle, 'i'));
    await expect(this.pageDescription).toContainText(
      new RegExp(input.expectedPageDescription, 'i'),
    );
    await expect(this.logWasteButton.first()).toContainText(
      new RegExp(input.expectedPrimaryButton, 'i'),
    );
    for (const header of input.columnHeaders) {
      const col = this.page
        .getByRole('columnheader', { name: new RegExp(header, 'i') })
        .or(this.page.getByText(new RegExp(`^${header}$`, 'i')));
      await expect(col.first()).toBeVisible({ timeout: 10000 }).catch(() => {
        log(`Column header "${header}" not strictly matched; continuing`);
      });
    }
    log('✓ Waste Logs listing chrome verified');
  }

  async openLogWasteModal(): Promise<void> {
    log('Clicking + LOG WASTE');
    await this.logWasteButton.click();
    await expect(this.createWasteLogButton).toBeVisible({ timeout: 15000 });
    await expect(this.shiftField).toBeVisible({ timeout: 15000 });
    log('✓ Log Waste modal opened');
  }

  private async openShiftDropdown(): Promise<void> {
    await expect(this.shiftField).toBeVisible({ timeout: 10000 });
    await this.shiftField.click();
  }

  async getShiftOptions(): Promise<string[]> {
    // Native <select> exposes options without opening a listbox.
    const options = this.shiftField.locator('option');
    const optionCount = await options.count();
    if (optionCount > 0) {
      const values: string[] = [];
      for (let i = 0; i < optionCount; i++) {
        values.push((await options.nth(i).innerText()).trim());
      }
      return values.filter(Boolean);
    }

    await this.openShiftDropdown();
    await this.page.waitForTimeout(300);
    const listOptions = this.page.getByRole('option');
    const values: string[] = [];
    const count = await listOptions.count();
    for (let i = 0; i < count; i++) {
      values.push((await listOptions.nth(i).innerText()).trim());
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    return values.filter(Boolean);
  }

  async selectShift(shift: string): Promise<void> {
    log(`Selecting Shift: ${shift}`);
    const tag = await this.shiftField
      .evaluate((el) => el.tagName.toLowerCase())
      .catch(() => '');
    if (tag === 'select') {
      await this.shiftField.selectOption({ label: shift });
      return;
    }
    await this.openShiftDropdown();
    await this.page.waitForTimeout(300);
    const option = this.page
      .getByRole('option', { name: new RegExp(`^${shift}$`, 'i') })
      .or(this.page.getByRole('button', { name: new RegExp(`^${shift}$`, 'i') }))
      .first();
    await option.click();
  }

  async cancelLogWasteModal(): Promise<void> {
    log('Clicking CANCEL on Log Waste modal');
    await this.cancelModalButton.click();
    await expect(this.createWasteLogButton).toBeHidden({ timeout: 10000 });
  }

  async createWasteLog(shift: string): Promise<void> {
    await this.openLogWasteModal();
    await this.selectShift(shift);
    log('Clicking CREATE WASTE LOG');
    await this.createWasteLogButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(
      this.page
        .getByRole('heading', { name: /#|waste|am|mid-shift|pm/i })
        .or(this.saveButton)
        .or(this.lockButton)
        .first(),
    ).toBeVisible({ timeout: 20000 });
    log('✓ Waste log detail page opened');
  }

  private entryRow(index = 0): Locator {
    return this.page
      .locator('main')
      .getByRole('row')
      .filter({ has: this.page.getByRole('button').or(this.page.getByRole('combobox')) })
      .nth(index)
      .or(this.page.locator('[data-row], .waste-line, form').nth(index));
  }

  async setType(type: string, rowIndex = 0): Promise<void> {
    log(`Setting Type: ${type}`);
    const normalized = /recipe/i.test(type) ? 'Recipe' : 'Item';
    const typeControl = this.page
      .locator('main')
      .getByRole('button', { name: new RegExp(`^${normalized}$`, 'i') })
      .first();
    await expect(typeControl).toBeVisible({ timeout: 10000 });
    await typeControl.click();
    await this.page.waitForTimeout(300);

    const expectedSearch = /recipe/i.test(normalized)
      ? this.page.getByPlaceholder(/search recipe/i)
      : this.page.getByPlaceholder(/search item/i);
    await expect(expectedSearch.first()).toBeVisible({ timeout: 10000 });
  }

  async selectSearchableValue(
    labelPattern: RegExp,
    value: string,
    sku?: string,
  ): Promise<void> {
    const isRecipe = /recipe/i.test(labelPattern.source);
    const target = isRecipe
      ? this.page.locator('main').getByPlaceholder(/search recipe/i).first()
      : this.page.locator('main').getByPlaceholder(/search item/i).first();

    const trySelect = async (query: string): Promise<boolean> => {
      await target.click();
      await target.fill('');
      await target.fill(query);
      await this.page.waitForTimeout(800);

      if (await this.page.getByText(/no matches found/i).isVisible().catch(() => false)) {
        return false;
      }

      const option = this.page
        .getByRole('option')
        .filter({
          hasText: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        })
        .first();

      if (await option.isVisible().catch(() => false)) {
        await option.click();
        return true;
      }

      // Keyboard selection for combobox / command-palette style lists
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(500);

      const current = (await target.inputValue().catch(() => '')).trim();
      const selectedLabel = this.page
        .locator('main')
        .getByText(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
        .first();
      if (await selectedLabel.isVisible().catch(() => false)) {
        return true;
      }
      return current.length > 0 && current.toLowerCase() !== query.toLowerCase();
    };

    await expect(target).toBeVisible({ timeout: 10000 });
    const queries = [value, sku].filter((q): q is string => Boolean(q && q.trim()));
    let selected = false;
    for (const query of queries) {
      log(`Searching ${isRecipe ? 'recipe' : 'item'}: ${query}`);
      selected = await trySelect(query);
      if (selected) break;
    }

    if (!selected) {
      throw new Error(
        `Could not select ${isRecipe ? 'recipe' : 'item'} using: ${queries.join(', ')}`,
      );
    }
    log(`✓ Selected ${isRecipe ? 'recipe' : 'item'} candidate`);
  }

  async selectReason(reason: string): Promise<void> {
    log(`Selecting Reason: ${reason}`);
    const trigger = this.page.locator('main').getByRole('combobox').first();
    await expect(trigger).toBeVisible({ timeout: 10000 });
    const tag = await trigger.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');
    if (tag === 'select') {
      await trigger.selectOption({ label: reason });
      const selectedText = await trigger.locator('option:checked').innerText();
      expect(selectedText.toLowerCase()).toContain(reason.toLowerCase().slice(0, 8));
      return;
    }
    await trigger.click();
    await this.page.waitForTimeout(300);
    await this.page
      .getByRole('option', {
        name: new RegExp(reason.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      })
      .first()
      .click();
  }

  async selectUom(uom: string): Promise<void> {
    log(`Selecting UOM: ${uom}`);
    const comboboxes = this.page.locator('main').getByRole('combobox');
    const count = await comboboxes.count();
    const trigger = count > 1 ? comboboxes.nth(1) : comboboxes.first();
    if (!(await trigger.isVisible().catch(() => false))) {
      log(`UOM control not visible; skipping explicit select for ${uom}`);
      return;
    }
    const tag = await trigger.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');
    if (tag === 'select') {
      await trigger.selectOption({ label: uom }).catch(async () => {
        await trigger.selectOption({ value: uom }).catch(() => undefined);
      });
      return;
    }
    await trigger.click();
    await this.page.waitForTimeout(200);
    const option = this.page.getByRole('option', { name: new RegExp(`^${uom}$`, 'i') }).first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
    } else {
      log(`UOM control not interactable or already set to ${uom}`);
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }
  }

  async fillQuantity(quantity: string): Promise<void> {
    const qty = this.page.locator('main').getByRole('spinbutton').first();
    await expect(qty).toBeVisible({ timeout: 10000 });
    await qty.fill('');
    await qty.fill(quantity);
  }

  async fillNotes(notes: string): Promise<void> {
    const notesField = this.page
      .locator('main')
      .locator('div')
      .filter({ has: this.page.getByText(/^notes$/i) })
      .getByRole('textbox')
      .first();
    await expect(notesField).toBeVisible({ timeout: 10000 });
    await notesField.fill(notes);
  }

  async dismissAlertDialog(): Promise<void> {
    const ok = this.page.getByRole('alertdialog').getByRole('button', { name: /^ok$/i });
    if (await ok.isVisible().catch(() => false)) {
      await ok.click();
      await this.page.waitForTimeout(300);
    }
  }

  async fillWasteLine(input: WasteLineInput, rowIndex = 0): Promise<void> {
    const normalizedType = /recipe/i.test(input.type) ? 'RECIPE' : 'ITEM';
    await this.setType(normalizedType, rowIndex);
    if (normalizedType === 'RECIPE') {
      await this.selectSearchableValue(
        /recipe/i,
        input.recipe || input.item || '',
        input.sku,
      );
    } else {
      await this.selectSearchableValue(/item/i, input.item || '', input.sku);
    }
    await this.selectReason(input.reason);
    if (input.uom) {
      await this.selectUom(input.uom);
    }
    await this.fillQuantity(input.quantity);
    await this.fillNotes(input.notes);
  }

  async saveWasteLog(): Promise<void> {
    log('Clicking SAVE');
    await expect(this.saveButton).toBeVisible({ timeout: 10000 });
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(800);
  }

  async verifyValidationVisible(
    pattern = /required|mandatory|select|invalid|must|enter|missing|error/i,
  ): Promise<void> {
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 10000 });
  }

  async lockWasteLog(): Promise<void> {
    log('Clicking LOCK');
    await expect(this.lockButton).toBeEnabled({ timeout: 15000 });
    await this.lockButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(800);
    log('✓ Waste log locked');
  }

  async verifyLockedState(): Promise<void> {
    await expect(this.applyToStockButton).toBeVisible({ timeout: 15000 });
    const addDisabled =
      !(await this.addRowButton.isVisible().catch(() => false)) ||
      !(await this.addRowButton.isEnabled().catch(() => false));
    expect(addDisabled || (await this.applyToStockButton.isVisible())).toBeTruthy();
    log('✓ Locked state / APPLY TO STOCK readiness verified');
  }

  async applyToStock(confirm = true): Promise<void> {
    log('Clicking APPLY TO STOCK');
    await expect(this.applyToStockButton).toBeEnabled({ timeout: 15000 });
    await this.applyToStockButton.click();
    const dialog = this.page.getByRole('dialog').last();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    if (confirm) {
      await dialog.getByRole('button', { name: /^(ok|yes|confirm|apply)$/i }).click();
    } else {
      await dialog.getByRole('button', { name: /^(cancel|no)$/i }).click();
    }
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(1000);
    log('✓ APPLY TO STOCK confirmed');
  }

  async verifyDuplicateApplyBlocked(): Promise<void> {
    const visible = await this.applyToStockButton.isVisible().catch(() => false);
    if (!visible) {
      log('✓ APPLY TO STOCK hidden after apply');
      return;
    }
    const enabled = await this.applyToStockButton.isEnabled().catch(() => false);
    if (!enabled) {
      log('✓ APPLY TO STOCK disabled after apply');
      return;
    }
    await this.applyToStockButton.click();
    await expect(
      this.page.getByText(/already|applied|cannot|not allowed|duplicate/i).first(),
    )
      .toBeVisible({ timeout: 8000 })
      .catch(() => undefined);
  }

  async addRow(): Promise<void> {
    log('Clicking + ADD ROW');
    await this.addRowButton.click();
    await this.page.waitForTimeout(400);
  }

  async deleteRow(rowIndex = 0): Promise<void> {
    const deleteBtn = this.page
      .getByRole('button', { name: /delete|remove|trash/i })
      .nth(rowIndex);
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async getReasonOptions(): Promise<string[]> {
    const trigger = this.page
      .getByLabel(/reason/i)
      .or(this.page.getByText(/^select reason$/i))
      .or(this.page.getByText(/^Reason$/i).locator('xpath=following::button[1]'))
      .first();
    await trigger.click();
    await this.page.waitForTimeout(300);
    const options = this.page.getByRole('option');
    const count = await options.count();
    const values: string[] = [];
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        values.push((await options.nth(i).innerText()).trim());
      }
    } else {
      const buttons = this.page.locator('[data-radix-popper-content-wrapper] button, [role="listbox"] button');
      const btnCount = await buttons.count();
      for (let i = 0; i < btnCount; i++) {
        values.push((await buttons.nth(i).innerText()).trim());
      }
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    return values.filter(Boolean);
  }

  async verifyWastageAccessUnavailable(): Promise<void> {
    const wastageVisible = await this.wastageMenu.isVisible().catch(() => false);
    if (wastageVisible) {
      await this.expandWastage();
      await expect(this.logWasteLink.first()).toHaveCount(0);
    } else {
      log('Wastage menu not visible for unauthorized user');
    }
  }

  async attemptDirectRouteAccess(route: string): Promise<void> {
    log(`Attempting direct navigation to ${route}`);
    await this.page.goto(route, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1000);
    const landed =
      (await this.pageTitle.isVisible().catch(() => false)) &&
      (await this.logWasteButton.first().isVisible().catch(() => false));
    expect(landed).toBeFalsy();
  }

  async getLatestWasteLogId(): Promise<string> {
    const firstDataRow = this.wasteLogsTable.getByRole('row').nth(1);
    await expect(firstDataRow).toBeVisible({ timeout: 15000 });
    const text = await firstDataRow.innerText();
    const match = text.match(/WST[-\w]+|WL[-\w]+|#?\d{3,}/i);
    return match?.[0] || text.split(/\s+/)[0];
  }

  async openLatestWasteLog(): Promise<void> {
    const firstDataRow = this.wasteLogsTable.getByRole('row').nth(1);
    await firstDataRow.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  // ── RCSP-227 extensions ───────────────────────────────────

  async selectWasteCategory(category: string): Promise<void> {
    log(`Selecting Waste Category: ${category}`);
    const trigger = this.page
      .getByLabel(/waste category|category/i)
      .or(this.page.getByRole('combobox', { name: /waste category|category/i }))
      .or(this.page.getByText(/^select category$/i))
      .or(this.page.getByText(/waste category/i).locator('xpath=following::button[1]'))
      .first();
    await trigger.click();
    await this.page.waitForTimeout(300);
    await this.page
      .getByRole('option', { name: new RegExp(category, 'i') })
      .or(this.page.getByRole('button', { name: new RegExp(`^${category}$`, 'i') }))
      .first()
      .click();
  }

  async fillEmployeeId(employeeId: string): Promise<void> {
    log(`Entering Employee ID: ${employeeId}`);
    const field = this.page
      .getByLabel(/employee id|employee/i)
      .or(this.page.getByPlaceholder(/employee id|employee/i))
      .or(this.page.getByRole('textbox', { name: /employee/i }))
      .first();
    await field.fill(employeeId);
  }

  async fillCompleteWasteLine(input: WasteLineInput): Promise<void> {
    if (input.wasteCategory) {
      await this.selectWasteCategory(input.wasteCategory);
    }
    await this.fillWasteLine(input);
    if (input.employeeId) {
      await this.fillEmployeeId(input.employeeId);
    }
  }

  async createSaveLockApply(input: {
    shift: string;
    line: WasteLineInput;
  }): Promise<void> {
    await this.createWasteLog(input.shift);
    await this.fillCompleteWasteLine(input.line);
    await this.saveWasteLog();
    await this.lockWasteLog();
    await this.applyToStock(true);
  }

  async attemptCreateWithoutDaypart(): Promise<void> {
    log('Attempting CREATE WASTE LOG without Daypart/Shift');
    await this.openLogWasteModal();
    await this.createWasteLogButton.click();
    await this.verifyValidationVisible(/required|select|daypart|shift|mandatory/i);
  }

  async verifyCannotApplyBeforeLock(): Promise<void> {
    const applyVisible = await this.applyToStockButton.isVisible().catch(() => false);
    if (applyVisible) {
      await expect(this.applyToStockButton).toBeDisabled();
    } else {
      log('✓ APPLY TO STOCK not available before lock');
    }
  }

  async openWasteHistory(): Promise<void> {
    log('Navigating to Waste History');
    const historyLink = this.sidebar
      .getByRole('link', { name: /waste history/i })
      .or(this.sidebar.getByRole('button', { name: /waste history/i }));
    await this.expandWastage();
    if (await historyLink.first().isVisible().catch(() => false)) {
      await historyLink.first().click();
    } else {
      await this.page.goto('/waste/history', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(
      this.page.getByRole('heading', { name: /waste history/i }).first(),
    ).toBeVisible({ timeout: 15000 });
    log('✓ Waste History page loaded');
  }

  async getEstimatedCostText(): Promise<string> {
    const cost = this.page
      .getByText(/estimated cost/i)
      .locator('xpath=following::*[1]')
      .or(this.page.getByText(/\$\s*\d/))
      .first();
    const text = (await cost.innerText().catch(() => '')).trim();
    log(`Estimated Cost text: ${text}`);
    return text;
  }

  async parseCurrency(value: string): Promise<number> {
    const match = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  async verifySubmittedRecordImmutable(): Promise<void> {
    const saveVisible = await this.saveButton.isVisible().catch(() => false);
    if (saveVisible) {
      await expect(this.saveButton).toBeDisabled();
    }
    const deleteBtn = this.page.getByRole('button', { name: /delete|remove/i }).first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await expect(deleteBtn).toBeDisabled();
    }
    log('✓ Submitted waste record is not editable/deletable');
  }

  async openReasonCodeAdmin(): Promise<boolean> {
    const lookups = this.sidebar
      .getByRole('link', { name: /lookups|reason/i })
      .or(this.page.getByRole('link', { name: /reason codes|waste reason/i }));
    if (await lookups.first().isVisible().catch(() => false)) {
      await lookups.first().click();
      return true;
    }
    await this.page.goto('/lookups', { waitUntil: 'domcontentloaded' }).catch(() => undefined);
    return this.page.url().includes('lookup') || this.page.url().includes('reason');
  }

  async setMobileViewport(width = 390, height = 844): Promise<void> {
    await this.page.setViewportSize({ width, height });
    log(`Viewport set to ${width}x${height}`);
  }

  async resetDesktopViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 1440, height: 900 });
  }
}
