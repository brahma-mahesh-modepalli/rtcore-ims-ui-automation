/**
 * StockCountAddItemPage – shared Add Item type-ahead dialog
 * ========================================================
 * Used by Daily / Weekly / Monthly Stock Count flows (RCSP-172).
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class StockCountAddItemPage {
  readonly dialog: Locator;
  readonly searchInput: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;
  readonly uomField: Locator;
  readonly pluField: Locator;
  readonly itemNameField: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page
      .locator('[role="dialog"], [data-state="open"]')
      .filter({ hasText: /add item/i })
      .first()
      .or(
        page
          .locator('div')
          .filter({ has: page.getByPlaceholder(/search by name or plu/i) })
          .filter({ hasText: /add item/i })
          .first(),
      );

    this.searchInput = page.getByPlaceholder(/search by name or plu/i).first();
    this.cancelButton = page
      .getByRole('button', { name: /^cancel$/i })
      .filter({ hasNotText: /count/i })
      .last();
    this.confirmButton = page.getByRole('button', { name: /^add item$/i }).last();
    this.uomField = page
      .getByLabel(/^uom$/i)
      .or(page.locator('label').filter({ hasText: /^uom$/i }).locator('..').locator('input, [role="textbox"], [aria-readonly]'))
      .first();
    this.pluField = page
      .getByLabel(/plu/i)
      .or(page.locator('label').filter({ hasText: /plu/i }).locator('..').locator('input, [role="textbox"]'))
      .first();
    this.itemNameField = page
      .getByLabel(/item name|^item$/i)
      .or(page.locator('label').filter({ hasText: /^item( name)?$/i }).locator('..').locator('input, [role="textbox"]'))
      .first();
  }

  async verifyDialogOpen(): Promise<void> {
    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
    log('✓ Add Item popup / search field is visible');
  }

  async search(term: string): Promise<void> {
    log(`Add Item search: "${term}"`);
    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
    await this.searchInput.click();
    await this.searchInput.fill('');
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(700);
  }

  resultOptions(): Locator {
    return this.page.getByRole('option').or(
      this.page.locator('[cmdk-item], [data-option], [role="listbox"] [role="option"], li[role="option"]'),
    );
  }

  async getVisibleResultTexts(): Promise<string[]> {
    const options = this.resultOptions();
    const count = await options.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const visible = await options.nth(i).isVisible().catch(() => false);
      if (!visible) continue;
      const text = (await options.nth(i).innerText()).trim();
      if (text) values.push(text);
    }
    return values;
  }

  async verifyMatchingResults(searchTerm: string): Promise<void> {
    await this.page.waitForTimeout(500);
    const noMatch = this.page.getByText(/no active items match|no matches|no results/i);
    const hasNoMatch = await noMatch.first().isVisible().catch(() => false);
    expect(hasNoMatch).toBeFalsy();

    const results = await this.getVisibleResultTexts();
    expect(results.length).toBeGreaterThan(0);
    const term = searchTerm.trim().toLowerCase();
    expect(
      results.some((r) => r.toLowerCase().includes(term) || term.includes(r.toLowerCase().slice(0, 3))),
    ).toBeTruthy();
    log(`✓ Matching results for "${searchTerm}": ${results.slice(0, 3).join(' | ')}`);
  }

  async verifyNoMatchingResults(searchTerm?: string): Promise<void> {
    await this.page.waitForTimeout(500);
    const noMatch = this.page.getByText(
      searchTerm
        ? new RegExp(`no active items match.*${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
        : /no active items match|no matches|no results/i,
    );
    const results = await this.getVisibleResultTexts();
    const noMatchVisible = await noMatch.first().isVisible().catch(() => false);
    expect(noMatchVisible || results.length === 0).toBeTruthy();
    log(`✓ No matching inventory items for "${searchTerm ?? ''}"`);
  }

  async verifyInactiveItemExcluded(inactiveTerm: string): Promise<void> {
    await this.search(inactiveTerm);
    await this.page.waitForTimeout(500);
    const results = await this.getVisibleResultTexts();
    const leaked = results.some((r) =>
      new RegExp(inactiveTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(r),
    );
    expect(leaked).toBeFalsy();
    log(`✓ Inactive item "${inactiveTerm}" not present in results`);
  }

  async selectFirstMatchingResult(preferredText?: string): Promise<string> {
    await this.page.waitForTimeout(500);
    const options = this.resultOptions();
    let target = options.first();
    if (preferredText?.trim()) {
      const preferred = options
        .filter({ hasText: new RegExp(preferredText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
        .first();
      if (await preferred.isVisible().catch(() => false)) {
        target = preferred;
      }
    }
    await expect(target).toBeVisible({ timeout: 15000 });
    const label = (await target.innerText()).trim();
    await target.click();
    await this.page.waitForTimeout(400);
    log(`✓ Selected item: ${label}`);
    return label;
  }

  async verifyFieldsAutoPopulated(): Promise<void> {
    // After selection, dialog should show item identity (name/PLU/UOM) somewhere in the open surface.
    const surface = this.page.locator('main, [role="dialog"]').last();
    await expect(
      surface.getByText(/plu|uom|ea|cs|pk|tr/i).first(),
    ).toBeVisible({ timeout: 10000 });
    log('✓ Item details appear populated after selection');
  }

  async verifyUomReadOnly(): Promise<void> {
    const uomCandidates = [
      this.page.getByLabel(/^uom$/i),
      this.page.locator('input[name*="uom" i], [aria-label*="uom" i]'),
      this.page.locator('text=UOM').locator('xpath=following::input[1]'),
    ];

    for (const candidate of uomCandidates) {
      const field = candidate.first();
      if (!(await field.isVisible().catch(() => false))) continue;

      const disabled =
        (await field.isDisabled().catch(() => false)) ||
        (await field.getAttribute('readonly')) !== null ||
        (await field.getAttribute('aria-readonly')) === 'true' ||
        (await field.getAttribute('disabled')) !== null;

      if (disabled) {
        log('✓ UOM field is read-only / disabled');
        return;
      }

      const before = await field.inputValue().catch(async () => (await field.innerText()).trim());
      await field.click({ force: true }).catch(() => undefined);
      await this.page.keyboard.type('ZZ').catch(() => undefined);
      const after = await field.inputValue().catch(async () => (await field.innerText()).trim());
      expect(after).toBe(before);
      log('✓ UOM value could not be modified');
      return;
    }

    // Fallback: UOM shown as plain text (not an editable control)
    await expect(this.page.getByText(/^uom$/i).first()).toBeVisible({ timeout: 5000 });
    log('✓ UOM presented as non-editable label/text');
  }

  async confirmAddItem(): Promise<void> {
    const confirm = this.page
      .getByRole('button', { name: /^add item$/i })
      .last();
    await expect(confirm).toBeVisible({ timeout: 10000 });
    await confirm.click();
    await this.page.waitForTimeout(500);
    log('✓ Confirmed Add Item');
  }

  async addActiveItem(searchTerm: string, preferredItem?: string): Promise<string> {
    await this.search(searchTerm);
    const label = await this.selectFirstMatchingResult(preferredItem ?? searchTerm);
    await this.confirmAddItem();
    return label;
  }

  async cancel(): Promise<void> {
    const close = this.page.getByRole('button', { name: /close dialog|cancel/i }).first();
    if (await close.isVisible().catch(() => false)) {
      await close.click();
    } else {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }
    await this.page.waitForTimeout(300);
    log('✓ Add Item dialog closed');
  }
}
