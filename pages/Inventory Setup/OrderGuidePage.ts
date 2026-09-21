import { type Locator, type Page, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class OrderGuidePage {
  readonly sidebar: Locator;
  readonly inventorySetupMenu: Locator;
  readonly orderGuideLink: Locator;
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly vendorFilter: Locator;
  readonly activeOnlyFilter: Locator;
  readonly table: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.inventorySetupMenu = this.sidebar
      .getByRole('button', { name: /inventory setup/i })
      .or(this.sidebar.getByText(/inventory setup/i))
      .first();
    this.orderGuideLink = this.sidebar
      .getByRole('link', { name: /^order guide$/i })
      .or(this.sidebar.getByRole('button', { name: /^order guide$/i }))
      .or(this.sidebar.getByText(/^order guide$/i))
      .first();
    this.pageTitle = page.getByRole('heading', { name: /order guide/i }).first();
    this.searchInput = page
      .getByPlaceholder(/search.*(item|sku)|item.*name.*sku/i)
      .or(page.getByRole('textbox', { name: /search/i }))
      .first();
    this.vendorFilter = page
      .getByLabel(/vendor/i)
      .or(page.getByRole('combobox', { name: /vendor/i }))
      .or(page.getByText(/^vendor$/i))
      .first();
    this.activeOnlyFilter = page
      .getByLabel(/active only/i)
      .or(page.getByRole('checkbox', { name: /active only/i }))
      .or(page.getByText(/active only/i))
      .first();
    this.table = page.getByRole('table').first();
  }

  async open(): Promise<void> {
    log('Opening Inventory Setup -> Order Guide');
    if (!(await this.orderGuideLink.isVisible().catch(() => false))) {
      await this.inventorySetupMenu.click();
      await this.page.waitForTimeout(400);
    }
    await expect(this.orderGuideLink).toBeVisible({ timeout: 15_000 });
    const href = await this.orderGuideLink.getAttribute('href');
    if (href) {
      await this.page.goto(href);
    } else {
      await this.orderGuideLink.click();
    }
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.verifyLoaded();
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15_000 });
    await expect(this.searchInput).toBeVisible({ timeout: 15_000 });
    await expect(this.table).toBeVisible({ timeout: 15_000 });
  }

  private dataRows(): Locator {
    return this.table.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  async search(term: string): Promise<void> {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(500);
  }

  async verifyRowsExist(): Promise<void> {
    await expect(this.dataRows().first()).toBeVisible({ timeout: 15_000 });
  }

  async verifyNoResults(): Promise<void> {
    const emptyState = this.page.getByText(/no (records|results|items|data)|nothing to (show|display)|no matching/i).first();
    const rowCount = await this.dataRows().count();
    expect((await emptyState.isVisible().catch(() => false)) || rowCount === 0).toBeTruthy();
  }

  async verifyOnlyMatchingRows(term: string): Promise<void> {
    const rows = this.dataRows();
    for (let index = 0; index < await rows.count(); index += 1) {
      await expect(rows.nth(index)).toContainText(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    }
  }

  async selectVendor(vendor: string): Promise<void> {
    await expect(this.vendorFilter).toBeVisible();
    if ((await this.vendorFilter.getAttribute('role')) === 'combobox') {
      await this.vendorFilter.selectOption({ label: vendor });
    } else {
      await this.vendorFilter.click();
      await this.page.getByRole('option', { name: vendor, exact: true }).click();
    }
    await this.page.waitForTimeout(500);
  }

  async enableActiveOnly(): Promise<void> {
    await expect(this.activeOnlyFilter).toBeVisible();
    if ((await this.activeOnlyFilter.getAttribute('type')) === 'checkbox') {
      await this.activeOnlyFilter.check();
    } else {
      await this.activeOnlyFilter.click();
    }
    await this.page.waitForTimeout(500);
  }

  async verifyColumns(): Promise<void> {
    for (const column of ['Item Name', 'Vendor', 'Vendor SKU', 'Purchase UOM', 'Unit Cost', 'Minimum Quantity', 'Order Multiple', 'Status']) {
      await expect(this.table.getByRole('columnheader', { name: new RegExp(column, 'i') })).toBeVisible();
    }
  }

  async verifyNoInactiveRows(): Promise<void> {
    await expect(this.dataRows()).not.toContainText(/\binactive\b/i);
  }

  async verifyRowsUnique(): Promise<void> {
    const values = (await this.dataRows().allTextContents()).map((value) => value.replace(/\s+/g, ' ').trim()).filter(Boolean);
    expect(new Set(values).size).toBe(values.length);
  }

  async verifySearchCompletesWithin(maximumMs: number): Promise<void> {
    const started = Date.now();
    await this.searchInput.fill('');
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    expect(Date.now() - started).toBeLessThan(maximumMs);
  }
}