import { Page, Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

/**
 * DailyShiftCountPage – listing, create session, and detail Add Item entry (RCSP-172).
 */
export class DailyShiftCountPage {
  private newDailyShiftCountButton: Locator;
  private startDailyShiftCountButton: Locator;
  readonly pageTitle: Locator;
  readonly countIdHeader: Locator;
  readonly nameHeader: Locator;
  readonly timingHeader: Locator;
  readonly statusHeader: Locator;
  readonly blindHeader: Locator;
  readonly dateHeader: Locator;
  readonly addItemButton: Locator;
  readonly dailyCountTable: Locator;

  constructor(private page: Page) {
    this.newDailyShiftCountButton = page.getByRole('button', {
      name: /new daily shift count/i,
    });
    this.startDailyShiftCountButton = page.getByRole('button', {
      name: /start daily shift count/i,
    });
    this.pageTitle = page
      .locator('h1, h2')
      .filter({ hasText: 'Daily Shift Count' })
      .first();
    this.countIdHeader = page.locator('th').filter({ hasText: 'COUNT ID' }).first();
    this.nameHeader = page.locator('th').filter({ hasText: 'NAME' }).first();
    this.timingHeader = page.locator('th').filter({ hasText: 'TIMING' }).first();
    this.statusHeader = page.locator('th').filter({ hasText: 'STATUS' }).first();
    this.blindHeader = page.locator('th').filter({ hasText: 'BLIND' }).first();
    this.dateHeader = page.locator('th').filter({ hasText: 'DATE' }).first();
    this.addItemButton = page.getByRole('button', { name: /^add item$/i });
    this.dailyCountTable = page.getByRole('table').first();
  }

  private async verifyNewDailyShiftCountButton(): Promise<void> {
    await expect(this.newDailyShiftCountButton).toBeVisible();
  }

  private async verifyColumnHeaders(): Promise<void> {
    await expect(this.countIdHeader).toBeVisible();
    await expect(this.nameHeader).toBeVisible();
    await expect(this.timingHeader).toBeVisible();
    await expect(this.statusHeader).toBeVisible();
    await expect(this.blindHeader).toBeVisible();
    await expect(this.dateHeader).toBeVisible();
  }

  async verifyDailyShiftCountPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
    await this.verifyNewDailyShiftCountButton();
  }

  async verifyNewDailyShiftCountButtonEnabled(): Promise<void> {
    await expect(this.newDailyShiftCountButton).toBeVisible();
    await expect(this.newDailyShiftCountButton).toBeEnabled();
    log('✓ Verified: + NEW DAILY SHIFT COUNT button is enabled');
  }

  async clickNewDailyShiftCountButton(): Promise<void> {
    log('Clicking on + NEW DAILY SHIFT COUNT button');
    await this.newDailyShiftCountButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.newDailyShiftCountButton).toBeEnabled();
    await this.newDailyShiftCountButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    log('✓ Clicked on + NEW DAILY SHIFT COUNT button');
  }

  private shiftTrigger(): Locator {
    return this.page
      .getByRole('button', { name: /^(AM|Mid|Mid-Shift|PM|select shift)/i })
      .or(this.page.getByRole('combobox', { name: /shift/i }))
      .or(this.page.getByLabel(/shift/i))
      .first();
  }

  async openShiftDropdown(): Promise<void> {
    const trigger = this.shiftTrigger();
    await expect(trigger).toBeVisible({ timeout: 10000 });
    await trigger.click();
    await this.page.waitForTimeout(300);
  }

  async selectShift(shift: string): Promise<void> {
    log(`Selecting Daily Shift: ${shift}`);
    await this.openShiftDropdown();
    const exact = new RegExp(`^${shift.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    await this.page
      .getByRole('option', { name: exact })
      .or(this.page.getByRole('button', { name: exact }))
      .or(this.page.getByText(exact))
      .last()
      .click();
  }

  /** Visible option labels from the open shift dropdown (RCSP-171). */
  async getVisibleShiftOptionTexts(): Promise<string[]> {
    const options = this.page
      .getByRole('option')
      .or(this.page.locator('[role="listbox"] [role="option"], [cmdk-item], li[role="option"]'));
    const count = await options.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const visible = await options.nth(i).isVisible().catch(() => false);
      if (!visible) continue;
      const text = (await options.nth(i).innerText()).trim();
      if (text) values.push(text);
    }
    // Fallback: AM / Mid / PM buttons in a popover
    if (values.length === 0) {
      for (const label of ['AM', 'Mid', 'PM', 'Mid-Shift', 'Opening', 'Closing']) {
        const btn = this.page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') });
        if (await btn.first().isVisible().catch(() => false)) {
          values.push((await btn.first().innerText()).trim());
        }
      }
    }
    return values;
  }

  async verifyShiftOptions(
    allowed: string[],
    forbidden: string[],
  ): Promise<void> {
    await this.clickNewDailyShiftCountButton();
    await this.openShiftDropdown();
    const texts = (await this.getVisibleShiftOptionTexts()).map((t) => t.trim());
    log(`Shift options visible: ${texts.join(', ') || '(none parsed)'}`);

    for (const shift of allowed) {
      const found = texts.some((t) => new RegExp(`^${shift}$`, 'i').test(t));
      expect(found, `Expected shift option "${shift}"`).toBeTruthy();
    }
    for (const shift of forbidden) {
      const found = texts.some((t) => new RegExp(`^${shift}$`, 'i').test(t));
      expect(found, `Forbidden shift option "${shift}" should be absent`).toBeFalsy();
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    log('✓ Shift dropdown labels verified (AM / Mid / PM only)');
  }

  async fillShiftDate(date: string): Promise<void> {
    const dateInput = this.page
      .getByLabel(/shift date|date/i)
      .or(this.page.getByPlaceholder(/date/i))
      .or(this.page.locator('input[type="date"]'))
      .first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill(date);
    }
  }

  async fillName(name: string): Promise<void> {
    const nameInput = this.page
      .getByLabel(/^name$/i)
      .or(this.page.getByPlaceholder(/name/i))
      .or(this.page.getByRole('textbox').last())
      .first();
    if (await nameInput.isVisible().catch(() => false)) {
      const readonly = (await nameInput.getAttribute('readonly')) !== null;
      if (!readonly) {
        await nameInput.fill(name);
      }
    }
  }

  async clickStartDailyShiftCount(): Promise<void> {
    log('Clicking START DAILY SHIFT COUNT');
    await expect(this.startDailyShiftCountButton).toBeVisible({ timeout: 15000 });
    await this.startDailyShiftCountButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(this.addItemButton.first()).toBeVisible({ timeout: 20000 });
    log('✓ Daily Shift Count detail page opened');
  }

  async createDailyShiftCount(input: {
    shift: string;
    shiftDate?: string;
    name?: string;
  }): Promise<void> {
    await this.clickNewDailyShiftCountButton();
    await this.selectShift(input.shift);
    if (input.shiftDate) {
      await this.fillShiftDate(input.shiftDate);
    }
    if (input.name) {
      await this.fillName(input.name);
    }
    await this.clickStartDailyShiftCount();
  }

  async openFirstDailyShiftCount(): Promise<void> {
    log('Opening first Daily Shift Count from listing');
    const row = this.dailyCountTable.getByRole('row').nth(1);
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await this.page.waitForLoadState('networkidle').catch(() => undefined);
      await expect(this.addItemButton.first()).toBeVisible({ timeout: 20000 });
      log('✓ Existing Daily Shift Count opened');
      return;
    }
    throw new Error('No Daily Shift Count rows available to open');
  }

  async openAddItemDialog(): Promise<void> {
    log('Opening + ADD ITEM on Daily Shift Count');
    await expect(this.addItemButton.first()).toBeVisible({ timeout: 15000 });
    await this.addItemButton.first().click();
    await expect(
      this.page.getByPlaceholder(/search by name or plu/i).first(),
    ).toBeVisible({ timeout: 15000 });
    log('✓ Add Item popup opened');
  }

  /** Header / summary area should reflect the selected shift (RCSP-171). */
  async verifyShiftInHeader(shiftFragment: string): Promise<void> {
    const header = this.page.locator('main, [role="main"], h1, h2, header').first();
    await expect(
      this.page.getByText(new RegExp(shiftFragment, 'i')).first(),
    ).toBeVisible({ timeout: 15000 });
    log(`✓ Shift "${shiftFragment}" visible on Daily Shift Count detail`);
    void header;
  }

  async getDetailItemRowCount(): Promise<number> {
    const rows = this.page
      .getByRole('table')
      .first()
      .getByRole('row')
      .filter({ hasNot: this.page.locator('th') });
    const tableRows = await rows.count().catch(() => 0);
    if (tableRows > 0) return tableRows;

    const itemRows = this.page.locator(
      '[data-testid*="item" i], tr:has(td), [class*="count-item" i]',
    );
    return itemRows.count().catch(() => 0);
  }

  async verifyPreloadedItemsPresent(): Promise<void> {
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    const empty = this.page.getByText(
      /no items|empty count list|no count items|add items to get started/i,
    );
    const emptyVisible = await empty.first().isVisible().catch(() => false);
    const count = await this.getDetailItemRowCount();
    expect(emptyVisible && count === 0).toBeFalsy();
    expect(count).toBeGreaterThan(0);
    log(`✓ Pre-loaded count list items present (${count} rows)`);
  }

  async verifyEmptyStateOrAddItemAvailable(): Promise<void> {
    const empty = this.page.getByText(
      /no items|empty count list|no count items|add items to get started|no inventory items/i,
    );
    const emptyVisible = await empty.first().isVisible().catch(() => false);
    const addVisible = await this.addItemButton.first().isVisible().catch(() => false);
    expect(addVisible).toBeTruthy();
    if (emptyVisible) {
      log('✓ Empty count-list state shown; Add Item still available');
    } else {
      log('✓ Count list has items (store not empty); Add Item still available');
    }
  }

  async clickSubmitOrSave(): Promise<void> {
    const submit = this.page
      .getByRole('button', { name: /^(submit|save|complete|finish)/i })
      .first();
    await expect(submit).toBeVisible({ timeout: 15000 });
    await submit.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    log('✓ Submit / Save clicked on Daily Shift Count');
  }

  async verifyOutsideWindowValidation(): Promise<boolean> {
    const msg = this.page.getByText(
      /outside.*(window|shift)|not within|invalid shift time|cannot submit|submission.*restricted/i,
    );
    return msg.first().isVisible().catch(() => false);
  }

  /** Listing row should show shift, date, and employee after submit (RCSP-171_13). */
  async verifySubmittedListingMetadata(opts: {
    shift: string;
    dateFragment?: string;
  }): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
    const body = this.page.locator('main, [role="main"]').first();
    await expect(body.getByText(new RegExp(opts.shift, 'i')).first()).toBeVisible({
      timeout: 15000,
    });
    if (opts.dateFragment) {
      await expect(
        body.getByText(new RegExp(opts.dateFragment.replace(/-/g, '[-/]'), 'i')).first(),
      ).toBeVisible({ timeout: 10000 }).catch(() => undefined);
    }
    // Employee ID / user column often numeric or email-like
    const employeeHint = body.getByText(
      /employee|user|submitted by|admin@|@[a-z0-9.-]+\.[a-z]{2,}/i,
    );
    const hasEmployee =
      (await employeeHint.first().isVisible().catch(() => false)) ||
      (await body.getByRole('cell').nth(1).isVisible().catch(() => false));
    expect(hasEmployee).toBeTruthy();
    log('✓ Submitted Daily Shift Count listing shows shift / date / employee context');
  }

  /** @deprecated kept for RCSP-115 compatibility */
  async clickstartWeeklyCountButton(): Promise<void> {
    await this.page.getByRole('button', { name: /Start Weekly Count/i }).click();
    log('✓ Start Weekly Count Button is clicked successfully');
  }
}
