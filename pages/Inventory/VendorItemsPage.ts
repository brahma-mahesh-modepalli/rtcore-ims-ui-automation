/**
 * VendorItemsPage – Page Object
 * =============================
 * Locators and actions for INVENTORY → Vendor Items, used to validate that
 * the Price shown in the UI (searched by SKU, under a selected store) matches
 * the database unit_cost (RCSP-283).
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';

const VENDOR_ITEMS_PATH = '/inventory/vendor-items';

export class VendorItemsPage {
  readonly sidebar: Locator;
  readonly inventorySection: Locator;
  readonly inventorySetupSection: Locator;
  readonly vendorItemsLink: Locator;

  readonly pageTitle: Locator;
  readonly searchInput: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();

    this.inventorySection = this.sidebar
      .getByRole('button', { name: /^inventory$/i })
      .or(this.sidebar.getByText(/^inventory$/i))
      .first();
    this.inventorySetupSection = this.sidebar
      .getByRole('button', { name: /inventory setup/i })
      .or(this.sidebar.getByText(/inventory setup/i))
      .first();

    this.vendorItemsLink = page
      .locator(`a[href="${VENDOR_ITEMS_PATH}"]`)
      .or(this.sidebar.getByRole('link', { name: /vendor items/i }))
      .first();

    this.pageTitle = page
      .getByRole('heading', { name: /vendor items/i })
      .first();
    this.searchInput = page
      .getByPlaceholder(/search sku, item, vendor|search by item name or sku|search.*item|item name or sku/i)
      .or(page.getByRole('textbox', { name: /search/i }))
      .first();
  }

  // ── Navigation ─────────────────────────────────────────────

  private async expandSectionIfNeeded(section: Locator): Promise<void> {
    const linkVisible = await this.vendorItemsLink.isVisible().catch(() => false);
    if (!linkVisible) {
      await section.click().catch(() => undefined);
      await this.page.waitForTimeout(400);
    }
  }

  async navigateToVendorItems(): Promise<void> {
    log('Navigating to Vendor Items via sidebar link');
    if (await this.vendorItemsLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await this.vendorItemsLink.click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      if (await this.pageTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
        log('✓ Vendor Items page loaded via sidebar link');
        return;
      }
    }

    // Sidebar link wasn't visible/didn't land — fall back to expanding parent sections, then a direct URL.
    log('Sidebar link did not land on Vendor Items; trying expandable sections');
    await this.expandSectionIfNeeded(this.inventorySection);
    await this.expandSectionIfNeeded(this.inventorySetupSection);
    if (await this.vendorItemsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.vendorItemsLink.click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      if (await this.pageTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
        log('✓ Vendor Items page loaded via expanded sidebar section');
        return;
      }
    }

    log(`Falling back to direct URL: ${CONFIG.baseURL}${VENDOR_ITEMS_PATH}`);
    await this.page.goto(`${CONFIG.baseURL}${VENDOR_ITEMS_PATH}`);
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
    log('✓ Vendor Items page loaded via direct URL');
  }

  // ── Search / table helpers ─────────────────────────────────

  async searchBySku(sku: string): Promise<void> {
    log(`Searching Vendor Items for SKU: ${sku}`);
    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
    await this.searchInput.fill('');
    await this.searchInput.fill(sku);
    await this.page.waitForTimeout(900);
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  private dataRows(): Locator {
    // The header row and data rows live in separate <table> elements (sticky header),
    // so scan rows across the whole page rather than a single table.
    return this.page
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
  }

  private async columnIndex(headerRegex: RegExp): Promise<number> {
    const headers = this.page.getByRole('columnheader');
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).innerText()).trim();
      if (headerRegex.test(text)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * A single SKU can have multiple vendor_item rows for the same vendor
   * (different vendor_sku). When vendorSku is provided, the row is matched on
   * both SKU and vendor_sku to uniquely identify the correct row.
   */
  rowBySku(sku: string, vendorSku?: string | null): Locator {
    const rows = this.dataRows().filter({
      hasText: new RegExp(sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    });
    if (vendorSku) {
      return rows
        .filter({ hasText: new RegExp(vendorSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
        .first();
    }
    return rows.first();
  }

  private async getCellValue(row: Locator, headerRegex: RegExp): Promise<string> {
    const index = await this.columnIndex(headerRegex);
    if (index === -1) {
      return (await row.innerText()).replace(/\s+/g, ' ').trim();
    }
    const cell = row.getByRole('cell').nth(index);
    return (await cell.innerText()).replace(/\s+/g, ' ').trim();
  }

  /** Verify the searched SKU returned a matching vendor item row before reading its Price. */
  async verifySearchReturnedSku(sku: string, vendorSku?: string | null): Promise<void> {
    const row = this.rowBySku(sku, vendorSku);
    await expect(row, `No vendor item row found for SKU ${sku}${vendorSku ? ` / vendor SKU ${vendorSku}` : ''}`).toBeVisible({ timeout: 25000 });
  }

  async getPriceForSku(sku: string, vendorSku?: string | null): Promise<string> {
    const row = this.rowBySku(sku, vendorSku);
    await expect(row).toBeVisible({ timeout: 25000 });
    return this.getCellValue(row, /price|unit cost/i);
  }

  /** Normalize a UI currency/decimal value for numeric comparison (strips $, commas). */
  normalizePrice(value: string): number {
    const cleaned = value.replace(/[^0-9.\-]/g, '');
    return Number.parseFloat(cleaned);
  }
}
