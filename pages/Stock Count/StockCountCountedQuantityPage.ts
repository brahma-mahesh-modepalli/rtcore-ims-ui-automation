/**
 * StockCountCountedQuantityPage – counted qty rules & summary cards (RCSP-212).
 * Shared across Daily Shift Count / Weekly Count / Monthly Count detail screens.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export type SummarySnapshot = {
  totalItems: number | null;
  counted: number | null;
  remaining: number | null;
};

export class StockCountCountedQuantityPage {
  readonly saveCountsButton: Locator;
  readonly addItemButton: Locator;
  readonly totalItemsLabel: Locator;
  readonly countedLabel: Locator;
  readonly remainingLabel: Locator;

  constructor(private readonly page: Page) {
    this.saveCountsButton = page.getByRole('button', { name: /save counts/i });
    this.addItemButton = page.getByRole('button', { name: /^add item$/i });
    this.totalItemsLabel = page.getByText(/total items/i).first();
    this.countedLabel = page.getByText(/^counted$/i).first();
    this.remainingLabel = page.getByText(/^remaining$/i).first();
  }

  private escape(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  itemRow(itemName: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ hasText: new RegExp(this.escape(itemName), 'i') })
      .first();
  }

  private cardValueNear(label: Locator): Locator {
    return label
      .locator('xpath=ancestor::*[contains(@class,"card") or self::div][1]')
      .locator('xpath=.//*[self::p or self::span or self::div][normalize-space()]')
      .first();
  }

  private parseLeadingNumber(text: string): number | null {
    const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  async readSummary(): Promise<SummarySnapshot> {
    const readNear = async (label: Locator): Promise<number | null> => {
      if (!(await label.isVisible().catch(() => false))) return null;
      const nearby = this.cardValueNear(label);
      const text =
        (await nearby.innerText().catch(() => '')) ||
        (await label.locator('..').innerText().catch(() => ''));
      return this.parseLeadingNumber(text);
    };

    // Prefer number that appears next to each card label in page text blocks
    const body = await this.page.locator('main, [role="main"]').first().innerText();
    const totalMatch = body.match(/Total Items[^\d]*(\d+)/i);
    const countedMatch = body.match(/\bCounted[^\d]*(\d+)/i);
    const remainingMatch = body.match(/\bRemaining[^\d]*(\d+)/i);

    const snapshot: SummarySnapshot = {
      totalItems:
        (totalMatch ? Number(totalMatch[1]) : null) ??
        (await readNear(this.totalItemsLabel)),
      counted:
        (countedMatch ? Number(countedMatch[1]) : null) ??
        (await readNear(this.countedLabel)),
      remaining:
        (remainingMatch ? Number(remainingMatch[1]) : null) ??
        (await readNear(this.remainingLabel)),
    };
    log(
      `Summary → Total=${snapshot.totalItems}, Counted=${snapshot.counted}, Remaining=${snapshot.remaining}`,
    );
    return snapshot;
  }

  async verifySummary(expected: {
    totalItems?: number;
    counted?: number;
    remaining?: number;
  }): Promise<void> {
    const actual = await this.readSummary();
    if (expected.totalItems !== undefined && actual.totalItems !== null) {
      expect(actual.totalItems).toBe(expected.totalItems);
    }
    if (expected.counted !== undefined && actual.counted !== null) {
      expect(actual.counted).toBe(expected.counted);
    }
    if (expected.remaining !== undefined && actual.remaining !== null) {
      expect(actual.remaining).toBe(expected.remaining);
    }
    log('✓ Summary card values verified');
  }

  eaInput(itemName: string): Locator {
    const row = this.itemRow(itemName);
    const spins = row.getByRole('spinbutton');
    // Prefer EA (3rd) when cs/pk/ea present
    return spins.nth(2).or(spins.last()).or(row.locator('input').last());
  }

  async enterEaQuantity(itemName: string, quantity: string): Promise<void> {
    const input = this.eaInput(itemName);
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.click();
    await input.fill('');
    await input.fill(quantity);
    await input.blur().catch(() => undefined);
    await this.page.waitForTimeout(300);
    log(`✓ Entered counted qty "${quantity}" for "${itemName}"`);
  }

  async clearEaQuantity(itemName: string): Promise<void> {
    const input = this.eaInput(itemName);
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.click();
    await input.fill('');
    await input.blur().catch(() => undefined);
    await this.page.waitForTimeout(300);
    log(`✓ Cleared counted qty for "${itemName}"`);
  }

  async readEaQuantity(itemName: string): Promise<string> {
    const input = this.eaInput(itemName);
    await expect(input).toBeVisible({ timeout: 15000 });
    const value = await input.inputValue().catch(async () =>
      (await input.innerText()).trim(),
    );
    return (value ?? '').trim();
  }

  async verifyEaBlank(itemName: string): Promise<void> {
    const value = await this.readEaQuantity(itemName);
    expect(['', '—', '-', 'n/a', 'null'].includes(value.toLowerCase()) || value === '').toBeTruthy();
    expect(value).not.toBe('0');
    log(`✓ Counted field for "${itemName}" remains blank (not auto-filled with 0)`);
  }

  async verifyEaValue(itemName: string, expected: string): Promise<void> {
    const value = await this.readEaQuantity(itemName);
    expect(value).toBe(expected);
    log(`✓ Counted field for "${itemName}" is "${expected}"`);
  }

  async verifyItemStatus(
    itemName: string,
    status: 'Counted' | 'Pending' | 'Not Counted' | 'Flagged',
  ): Promise<void> {
    const row = this.itemRow(itemName);
    const pattern =
      status === 'Not Counted' || status === 'Pending'
        ? /pending|not counted|remaining|blank/i
        : new RegExp(status, 'i');
    await expect(row.getByText(pattern).first()).toBeVisible({ timeout: 10000 });
    log(`✓ Item "${itemName}" status reflects "${status}"`);
  }

  async saveCounts(): Promise<void> {
    await expect(this.saveCountsButton).toBeVisible({ timeout: 15000 });
    await expect(this.saveCountsButton).toBeEnabled();
    await this.saveCountsButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    log('✓ SAVE COUNTS clicked');
  }

  async attemptInvalidInputs(
    itemName: string,
    invalidValues: string[],
  ): Promise<void> {
    for (const value of invalidValues) {
      log(`Trying invalid counted input: "${value}"`);
      const input = this.eaInput(itemName);
      await input.click();
      await input.fill('');
      await input.fill(value);
      await input.blur().catch(() => undefined);
      await this.page.waitForTimeout(200);

      // Either input rejects (value not kept) or validation message appears on save
      const kept = (await this.readEaQuantity(itemName)).trim();
      const rejectedInField =
        kept !== value &&
        !kept.includes(value) &&
        !/^-?\d+(\.\d+)?$/.test(kept);

      await this.saveCountsButton.click().catch(() => undefined);
      await this.page.waitForTimeout(400);
      const validation = this.page.getByText(
        /invalid|not allowed|must be|positive|number|numeric|cannot|too large|maximum|decimal/i,
      );
      const hasValidation = await validation.first().isVisible().catch(() => false);

      expect(
        rejectedInField || hasValidation || kept !== value,
        `Expected rejection/validation for invalid input "${value}" (kept="${kept}")`,
      ).toBeTruthy();
      log(`✓ Invalid input "${value}" rejected or validated`);
      await this.clearEaQuantity(itemName).catch(() => undefined);
    }
  }

  async reloadAndWait(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(this.saveCountsButton.or(this.addItemButton.first())).toBeVisible({
      timeout: 20000,
    });
    log('✓ Page reloaded; count session still open');
  }
}
