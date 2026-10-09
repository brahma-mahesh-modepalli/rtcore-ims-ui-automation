import { type Locator, type Page, expect } from '@playwright/test';

import type { VendorData } from '../../test-data/TestDataRepository';

export class VendorSetupPage {
  readonly vendorCodeInput: Locator;
  readonly vendorNameInput: Locator;
  readonly contactNameInput: Locator;
  readonly parentVendorControl: Locator;

  constructor(private readonly page: Page) {
    this.vendorCodeInput = page.getByLabel(/vendor code/i).first();
    this.vendorNameInput = page.getByLabel(/vendor name/i).first();
    this.contactNameInput = page.getByLabel(/contact name/i).first();
    this.parentVendorControl = page
      .getByLabel(/parent vendor/i)
      .or(page.getByRole('combobox', { name: /parent vendor/i }))
      .first();
  }

  private get sidebar(): Locator {
    return this.page.getByRole('complementary').first();
  }

  private get vendorTable(): Locator {
    return this.page.getByRole('table').last();
  }

  private vendorRow(code: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: code, exact: true }) })
      .first();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async navigateToVendors(): Promise<void> {
    const inventorySetup = this.sidebar
      .getByRole('button', { name: /^inventory setup$/i })
      .first();
    const vendorLink = this.sidebar
      .getByRole('link', { name: /^vendors?$/i })
      .or(this.sidebar.getByRole('button', { name: /^vendors?$/i }))
      .first();

    if (!(await vendorLink.isVisible().catch(() => false))) {
      await inventorySetup.click();
    }
    await expect(vendorLink).toBeVisible({ timeout: 15_000 });
    const href = await vendorLink.getAttribute('href');
    if (href) await this.page.goto(href);
    else await vendorLink.click();
    await expect(this.page.getByRole('heading', { name: /vendors?/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(this.vendorTable).toBeVisible();
  }

  async searchVendorByCode(code: string): Promise<void> {
    const search = this.page
      .getByPlaceholder(/search vendors?/i)
      .or(this.page.getByRole('textbox', { name: /search/i }))
      .first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill(code);
    }
    await expect(this.vendorRow(code)).toBeVisible({ timeout: 15_000 });
  }

  async openDeliveryDatesForVendor(code: string, vendorName: string): Promise<void> {
    await this.searchVendorByCode(code);
    await this.openVendorRecord(code, vendorName);

    const deliveryDatesControl = this.page
      .getByRole('button', { name: /delivery dates/i })
      .or(this.page.getByRole('tab', { name: /delivery dates/i }))
      .or(this.page.getByRole('link', { name: /delivery dates/i }))
      .first();
    await expect(deliveryDatesControl).toBeVisible({ timeout: 15_000 });
    await deliveryDatesControl.click();
    await expect(this.page.getByText(/delivery window/i).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async openVendorRecord(code: string, vendorName: string): Promise<void> {
    const row = this.vendorRow(code);
    await expect(row).toBeVisible();
    await row.getByRole('cell', { name: code, exact: true }).click();
    await expect(
      this.page.getByRole('heading', { name: new RegExp(this.escapeRegExp(vendorName), 'i') }),
    ).toBeVisible();
    await expect(this.page.getByText(`Code: ${code}`, { exact: true })).toBeVisible();
  }

  async selectThisWeekDeliveryWindow(): Promise<void> {
    const thisWeekSelected = this.page.getByRole('button', { name: /^this week$/i }).first();
    if (await thisWeekSelected.isVisible().catch(() => false)) return;

    const deliveryWindow = this.page
      .getByLabel(/delivery window/i)
      .or(this.page.getByRole('combobox', { name: /delivery window/i }))
      .first();
    await expect(deliveryWindow).toBeVisible();
    const tagName = await deliveryWindow.evaluate((element) => element.tagName);
    if (tagName === 'SELECT') {
      await deliveryWindow.selectOption({ label: 'This Week' });
    } else {
      await deliveryWindow.click();
      await this.page.getByRole('option', { name: /^this week$/i }).click();
    }
  }

  async searchDeliveryDatesByStore(storeName: string): Promise<void> {
    const search = this.page
      .getByPlaceholder(/search.*store|search/i)
      .or(this.page.getByRole('textbox', { name: /search/i }))
      .last();
    await expect(search).toBeVisible();
    await search.fill(storeName);
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async getDeliveryDateTextsForStore(storeName: string): Promise<string[]> {
    const tables = this.page.getByRole('table');
    const headerTable = tables.first();
    const rowsTable = tables.last();
    const headers = (await headerTable.getByRole('columnheader').allTextContents())
      .map((header) => header.replace(/\s+/g, ' ').trim());
    const dateColumn = headers.findIndex((header) => /^delivery date$/i.test(header));
    expect(dateColumn, 'Delivery Dates table should expose a date column').toBeGreaterThanOrEqual(0);

    const dates: string[] = [];
    for (let pageIndex = 0; pageIndex < 50; pageIndex += 1) {
      const rows = rowsTable.getByRole('row').filter({
        has: this.page.getByRole('cell'),
      });
      for (let rowIndex = 0; rowIndex < await rows.count(); rowIndex += 1) {
        const row = rows.nth(rowIndex);
        if (!(await row.getByText(storeName, { exact: false }).count())) continue;
        const cells = row.getByRole('cell');
        if (await cells.count() > dateColumn) {
          const dateText = (await cells.nth(dateColumn).innerText()).trim();
          if (dateText) dates.push(dateText);
        }
      }

      const nextButton = this.page.getByRole('button', { name: /next(?: page)?/i }).last();
      if (
        !(await nextButton.isVisible().catch(() => false)) ||
        !(await nextButton.isEnabled().catch(() => false))
      ) {
        break;
      }
      await nextButton.click();
      await this.page.waitForLoadState('networkidle').catch(() => undefined);
    }
    return dates;
  }

  async openNewVendor(): Promise<void> {
    await this.page.getByRole('button', { name: /new vendor/i }).click();
    await expect(this.vendorCodeInput).toBeVisible();
  }

  async verifyNewVendorFields(): Promise<void> {
    await expect(this.vendorCodeInput).toBeVisible();
    await expect(this.vendorNameInput).toBeVisible();
    await expect(this.contactNameInput).toBeVisible();
    await expect(this.parentVendorControl).toBeVisible();
  }

  async saveVendor(): Promise<void> {
    await this.page.getByRole('button', { name: /^save$/i }).last().click();
  }

  async verifyFormValidation(): Promise<void> {
    const invalidInputs = this.page.locator('input:invalid, [aria-invalid="true"]');
    const validationMessage = this.page.getByText(
      /required|enter .*vendor|vendor .*required|cannot be blank|must not be empty/i,
    ).first();
    await expect
      .poll(async () =>
        (await invalidInputs.count()) > 0 ||
        (await validationMessage.isVisible().catch(() => false)),
      )
      .toBeTruthy();
  }

  async verifyDuplicateValidation(): Promise<void> {
    await expect(
      this.page.getByText(/already exists|duplicate|vendor code.*used/i).first(),
    ).toBeVisible();
  }

  async openEditVendor(code: string): Promise<void> {
    const row = this.vendorRow(code);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /^Edit\b/i }).click();
    await expect(this.vendorCodeInput).toBeVisible();
  }

  async verifyEditVendorValues(vendor: VendorData): Promise<void> {
    await expect(this.vendorCodeInput).toHaveValue(vendor.code);
    await expect(this.vendorNameInput).toHaveValue(vendor.name);
    if (vendor.parent_name) {
      await expect(this.parentVendorControl).toContainText(vendor.parent_name);
    }
  }

  async cancelVendorEdit(): Promise<void> {
    await this.page.getByRole('button', { name: /^cancel$/i }).last().click();
    await expect(this.vendorCodeInput).not.toBeVisible();
  }

  async selectParentVendor(name: string): Promise<void> {
    const tagName = await this.parentVendorControl.evaluate((element) => element.tagName);
    if (tagName === 'SELECT') {
      await this.parentVendorControl.selectOption({ label: name });
      return;
    }
    await this.parentVendorControl.click();
    await this.page.getByRole('option', { name, exact: true }).click();
  }

  async verifyParentVendorOptionExcluded(code: string, name: string): Promise<void> {
    const tagName = await this.parentVendorControl.evaluate((element) => element.tagName);
    if (tagName === 'SELECT') {
      const options = (await this.parentVendorControl.locator('option').allTextContents())
        .map((option) => option.trim());
      expect(options).not.toContain(code);
      expect(options).not.toContain(name);
      return;
    }
    await this.parentVendorControl.click();
    const options = this.page.getByRole('option');
    await expect(options.filter({ hasText: new RegExp(this.escapeRegExp(code), 'i') })).toHaveCount(0);
    await expect(options.filter({ hasText: new RegExp(this.escapeRegExp(name), 'i') })).toHaveCount(0);
    await this.page.keyboard.press('Escape');
  }

  async verifyVendorHierarchy(vendor: VendorData): Promise<void> {
    const row = this.vendorRow(vendor.code);
    await expect(row).toBeVisible();
    await expect(row).toContainText(vendor.name);
    const headers = (await this.page.getByRole('columnheader').allTextContents())
      .map((header) => header.trim());
    const parentColumn = headers.findIndex((header) => /parent vendor|parent/i.test(header));
    expect(parentColumn, 'Vendor table must display the parent-vendor mapping').toBeGreaterThanOrEqual(0);
    const parentCell = row.getByRole('cell').nth(parentColumn);
    const parentText = (await parentCell.textContent())?.trim() ?? '';
    expect(parentText).toMatch(new RegExp(this.escapeRegExp(vendor.parent_name ?? vendor.parent_code ?? ''), 'i'));
  }

  async verifyStandaloneVendor(vendor: VendorData): Promise<void> {
    const row = this.vendorRow(vendor.code);
    await expect(row).toBeVisible();
    await expect(row).toContainText(vendor.name);
    const headers = (await this.page.getByRole('columnheader').allTextContents())
      .map((header) => header.trim());
    const parentColumn = headers.findIndex((header) => /parent vendor|parent/i.test(header));
    expect(parentColumn, 'Vendor table must display the parent-vendor field').toBeGreaterThanOrEqual(0);
    const parentText = (await row.getByRole('cell').nth(parentColumn).textContent())?.trim() ?? '';
    expect(parentText).toMatch(/^(?:-|n\/a|none)?$/i);
  }
}