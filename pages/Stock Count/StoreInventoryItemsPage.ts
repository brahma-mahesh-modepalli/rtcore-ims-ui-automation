/**
 * StoreInventoryItemsPage – read Variance Threshold for stock-count items (RCSP-211).
 * Lives under Stock Count per framework placement for this epic.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class StoreInventoryItemsPage {
  readonly searchInput: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page
      .getByPlaceholder(/search|item name|plu|sku/i)
      .or(page.getByRole('textbox').first())
      .first();
  }

  async navigateFromMenu(): Promise<void> {
    log('Navigating to Store Inventory Items');
    const inventory = this.page
      .getByRole('button', { name: /^inventory$/i })
      .or(this.page.getByText(/^inventory$/i))
      .first();
    if (await inventory.isVisible().catch(() => false)) {
      await inventory.click();
      await this.page.waitForTimeout(400);
    }
    const link = this.page
      .getByRole('link', { name: /store inventory items/i })
      .or(this.page.getByText(/store inventory items/i))
      .first();
    await expect(link).toBeVisible({ timeout: 15000 });
    await link.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    log('✓ Store Inventory Items opened');
  }

  async searchItem(term: string): Promise<void> {
    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(700);
  }

  /**
   * Best-effort parse of Variance Threshold % from listing or detail.
   * Returns null when the field cannot be read from the UI.
   */
  async getVarianceThresholdPercent(itemNameOrPlu: string): Promise<number | null> {
    await this.searchItem(itemNameOrPlu);
    const row = this.page
      .getByRole('row')
      .filter({ hasText: new RegExp(itemNameOrPlu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first();

    if (await row.isVisible().catch(() => false)) {
      await row.click().catch(() => undefined);
      await this.page.waitForTimeout(500);
    }

    const label = this.page.getByText(/variance\s*threshold/i).first();
    if (!(await label.isVisible().catch(() => false))) {
      log('⚠ Variance Threshold label not found on Store Inventory Items');
      return null;
    }

    const container = label.locator('xpath=ancestor::*[self::div or self::tr or self::td][1]');
    const text =
      (await container.innerText().catch(() => '')) ||
      (await this.page.locator('main').innerText().catch(() => ''));
    const match = text.match(/variance\s*threshold[^0-9%]*([0-9]+(?:\.[0-9]+)?)\s*%?/i);
    if (!match) {
      log('⚠ Could not parse Variance Threshold value');
      return null;
    }
    const value = Number(match[1]);
    log(`✓ Variance Threshold for "${itemNameOrPlu}": ${value}%`);
    return Number.isFinite(value) ? value : null;
  }
}
