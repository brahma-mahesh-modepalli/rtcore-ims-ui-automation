/**
 * ItemMasterPage – Page Object
 * ============================
 * Locators and actions for INVENTORY SETUP → Inventory Item (Item Master),
 * used by RCSP-191.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';

const ITEM_MASTER_PATH = '/items';

export interface ItemMasterRow {
  sku: string;
  name: string;
  category: string;
  type: string;
  uom: string;
  status: string;
}

export class ItemMasterPage {
  readonly sidebar: Locator;
  readonly inventorySetupSection: Locator;
  readonly itemMasterLink: Locator;

  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly typeDropdown: Locator;
  readonly statusDropdown: Locator;
  readonly noRecordsMessage: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();

    this.inventorySetupSection = this.sidebar
      .getByRole('button', { name: /inventory setup/i })
      .or(this.sidebar.getByText(/inventory setup/i))
      .first();

    this.itemMasterLink = page
      .locator(`a[href="${ITEM_MASTER_PATH}"]`)
      .or(this.sidebar.getByRole('link', { name: /inventory item/i }))
      .first();

    this.pageTitle = page
      .getByRole('heading', { name: /inventory item|item master/i })
      .first();
    this.searchInput = page
      .getByPlaceholder(/search.*item|item name.*plu|item name or plu/i)
      .or(page.getByRole('textbox', { name: /search/i }))
      .first();
    // Type/Status render as a visible display button synced to a hidden native
    // <select> (accessible progressive-enhancement pattern). Interact with the
    // native selects directly — far more reliable than the custom popover UI.
    this.typeDropdown = page.locator('select').nth(0);
    this.statusDropdown = page.locator('select').nth(1);
    this.noRecordsMessage = page.getByText(
      /no records found|no items found|no results|no matching/i,
    );
  }

  // ── Navigation ─────────────────────────────────────────────

  private async expandSectionIfNeeded(section: Locator): Promise<void> {
    const linkVisible = await this.itemMasterLink.isVisible().catch(() => false);
    if (!linkVisible) {
      await section.click().catch(() => undefined);
      await this.page.waitForTimeout(400);
    }
  }

  async navigateToItemMaster(): Promise<void> {
    log('Navigating to Inventory Setup → Inventory Item (Item Master)');
    if (await this.itemMasterLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      await this.itemMasterLink.click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      if (await this.pageTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
        log('✓ Item Master page loaded via sidebar link');
        return;
      }
    }

    log('Sidebar link did not land on Item Master; trying expandable sections');
    await this.expandSectionIfNeeded(this.inventorySetupSection);
    if (await this.itemMasterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.itemMasterLink.click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      if (await this.pageTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
        log('✓ Item Master page loaded via expanded sidebar section');
        return;
      }
    }

    log(`Falling back to direct URL: ${CONFIG.baseURL}${ITEM_MASTER_PATH}`);
    await this.page.goto(`${CONFIG.baseURL}${ITEM_MASTER_PATH}`);
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
    log('✓ Item Master page loaded via direct URL');
  }

  // ── Filters ────────────────────────────────────────────────

  async search(term: string): Promise<void> {
    log(`Searching Item Master for: "${term}"`);
    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
    await this.searchInput.fill('');
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(700);
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(500);
  }

  private async selectDropdownOption(select: Locator, optionText: string): Promise<void> {
    await select.selectOption({ label: optionText });
    await this.page.waitForTimeout(600);
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async selectType(type: string): Promise<void> {
    log(`Selecting Type filter: ${type}`);
    await this.selectDropdownOption(this.typeDropdown, type);
  }

  async selectStatus(status: string): Promise<void> {
    log(`Selecting Status filter: ${status}`);
    await this.selectDropdownOption(this.statusDropdown, status);
  }

  async getTypeDropdownOptions(): Promise<string[]> {
    return this.typeDropdown.locator('option').allTextContents();
  }

  async getStatusDropdownOptions(): Promise<string[]> {
    return this.statusDropdown.locator('option').allTextContents();
  }

  // ── Table helpers ──────────────────────────────────────────

  private dataRows(): Locator {
    // Header and body may render as separate <table> elements (sticky header),
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

  async verifyColumnsVisible(): Promise<void> {
    log('Verifying Item Master grid columns');
    const expectedHeaders = [/^sku$/i, /^name$/i, /^category$/i, /^type$/i, /uom/i, /^status$/i];
    for (const headerRegex of expectedHeaders) {
      const index = await this.columnIndex(headerRegex);
      expect(index, `Expected column matching ${headerRegex} to be visible`).toBeGreaterThanOrEqual(0);
    }
  }

  rowByName(name: string): Locator {
    return this.dataRows()
      .filter({ hasText: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first();
  }

  rowBySku(sku: string): Locator {
    return this.dataRows()
      .filter({ hasText: new RegExp(sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first();
  }

  async getRowCount(): Promise<number> {
    return this.dataRows().count();
  }

  async verifyNoResultsOrEmpty(): Promise<void> {
    const empty = await this.noRecordsMessage.first().isVisible().catch(() => false);
    const rowCount = await this.getRowCount();
    expect(empty || rowCount === 0).toBeTruthy();
  }

  private async getCellValue(row: Locator, headerRegex: RegExp): Promise<string> {
    const index = await this.columnIndex(headerRegex);
    if (index === -1) {
      return (await row.innerText()).replace(/\s+/g, ' ').trim();
    }
    const cell = row.getByRole('cell').nth(index);
    return (await cell.innerText()).replace(/\s+/g, ' ').trim();
  }

  /** Read all currently visible grid rows as structured objects. */
  async getVisibleRows(limit = 50): Promise<ItemMasterRow[]> {
    const rows = this.dataRows();
    const count = Math.min(await rows.count(), limit);
    const results: ItemMasterRow[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      results.push({
        sku: await this.getCellValue(row, /^sku$/i),
        name: await this.getCellValue(row, /^name$/i),
        category: await this.getCellValue(row, /^category$/i),
        type: await this.getCellValue(row, /^type$/i),
        uom: await this.getCellValue(row, /stock uom/i),
        status: await this.getCellValue(row, /^status$/i),
      });
    }
    return results;
  }

  async getFirstRowName(): Promise<string> {
    const row = this.dataRows().first();
    return this.getCellValue(row, /^name$/i);
  }

  async getStatusForRow(name: string): Promise<string> {
    const row = this.rowByName(name);
    await expect(row).toBeVisible({ timeout: 15000 });
    return this.getCellValue(row, /^status$/i);
  }
}
