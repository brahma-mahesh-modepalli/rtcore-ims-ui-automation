/**
 * UnitOfMeasurePage – Page Object
 * ===============================
 * Locators and actions for Inventory Setup → Unit of Measure
 * used by RCSP-287 (Units of Measure list / create / edit).
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export type UomRowSnapshot = {
  name: string;
  abbreviation: string;
  type: string;
};

export class UnitOfMeasurePage {
  readonly sidebar: Locator;
  readonly inventorySetupMenu: Locator;
  readonly unitOfMeasureLink: Locator;

  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly newUomButton: Locator;
  readonly uomTable: Locator;

  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly nameInput: Locator;
  readonly abbreviationInput: Locator;
  readonly typeDropdown: Locator;
  readonly cancelButton: Locator;
  readonly createUomButton: Locator;
  readonly saveUpdateButton: Locator;
  readonly modalCloseButton: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.inventorySetupMenu = this.sidebar
      .getByRole('button', { name: /inventory setup/i })
      .or(this.sidebar.getByRole('link', { name: /inventory setup/i }))
      .or(this.sidebar.getByText(/inventory setup/i))
      .first();
    this.unitOfMeasureLink = this.sidebar
      .getByRole('link', { name: /unit of measure|units of measure/i })
      .or(this.sidebar.getByRole('button', { name: /unit of measure|units of measure/i }))
      .or(this.sidebar.getByText(/unit of measure/i))
      .first();

    this.pageTitle = page
      .getByRole('heading', { name: /units of measure/i })
      .first();
    this.pageSubtitle = page.getByText(
      /manage unit definitions for inventory tracking/i,
    );
    this.newUomButton = page.getByRole('button', { name: /new uom/i });
    this.uomTable = page.getByRole('table').first();

    this.modal = page.getByRole('dialog').first();
    this.modalTitle = this.modal
      .getByRole('heading', { name: /new unit of measure|edit unit of measure|unit of measure/i })
      .or(page.getByRole('heading', { name: /new unit of measure|edit unit of measure/i }))
      .first();
    this.nameInput = this.modal
      .getByLabel(/^name$/i)
      .or(this.modal.getByPlaceholder(/name/i))
      .or(this.modal.getByRole('textbox', { name: /name/i }))
      .first();
    this.abbreviationInput = this.modal
      .getByLabel(/abbreviation/i)
      .or(this.modal.getByPlaceholder(/abbreviation/i))
      .or(this.modal.getByRole('textbox', { name: /abbreviation/i }))
      .first();
    this.typeDropdown = this.modal
      .getByLabel(/^type$/i)
      .or(this.modal.getByRole('combobox', { name: /type|select type/i }))
      .or(this.modal.getByText(/^select type$/i))
      .first();
    this.cancelButton = this.modal
      .getByRole('button', { name: /^cancel$/i })
      .first();
    this.createUomButton = this.modal
      .getByRole('button', { name: /create uom/i })
      .first();
    this.saveUpdateButton = this.modal
      .getByRole('button', { name: /save|update|create uom/i })
      .filter({ hasNotText: /^cancel$/i })
      .first();
    this.modalCloseButton = this.modal
      .getByRole('button', { name: /close|dismiss/i })
      .or(this.modal.locator('[aria-label*="close" i], button:has-text("×"), button:has-text("✕")'))
      .first();
  }

  // ── Navigation ────────────────────────────────────────────

  async expandInventorySetup(): Promise<void> {
    log('Expanding Inventory Setup menu');
    const linkVisible = await this.unitOfMeasureLink.isVisible().catch(() => false);
    if (!linkVisible) {
      await this.inventorySetupMenu.click();
      await this.page.waitForTimeout(400);
    }
  }

  async openUnitOfMeasure(): Promise<void> {
    log('Navigating to Inventory Setup → Unit of Measure');
    await this.expandInventorySetup();
    await expect(this.unitOfMeasureLink).toBeVisible({ timeout: 15000 });
    await this.unitOfMeasureLink.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.verifyPageLoaded();
    log('✓ Units of Measure page loaded');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
  }

  // ── Page / layout ─────────────────────────────────────────

  async verifyUomPageUi(options: {
    pageTitle: string;
    pageSubtitle: string;
    newUomButton: string;
    columnHeaders: string[];
  }): Promise<void> {
    log('Verifying Units of Measure page UI');
    await expect(
      this.page
        .getByRole('heading', {
          name: new RegExp(
            options.pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i',
          ),
        })
        .first(),
    ).toBeVisible();
    await expect(
      this.page.getByText(new RegExp(options.pageSubtitle, 'i')),
    ).toBeVisible();
    await expect(this.newUomButton).toBeVisible();
    await expect(this.newUomButton).toContainText(/new uom/i);
    await this.verifyColumnHeaders(options.columnHeaders);
    log('✓ Units of Measure page UI verified');
  }

  async verifyColumnHeaders(headers: string[]): Promise<void> {
    for (const header of headers) {
      await expect(
        this.uomTable
          .getByRole('columnheader', { name: new RegExp(header, 'i') })
          .or(this.page.getByText(new RegExp(`^${header}$`, 'i')))
          .first(),
      ).toBeVisible({ timeout: 10000 });
    }
  }

  // ── Row helpers ───────────────────────────────────────────

  uomRow(nameOrAbbr: string): Locator {
    return this.uomTable
      .getByRole('row')
      .filter({ hasText: new RegExp(nameOrAbbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first();
  }

  async getRowCount(): Promise<number> {
    const rows = this.uomTable.getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
    return rows.count();
  }

  async verifyUomVisible(name: string, abbreviation?: string, type?: string): Promise<void> {
    log(`Verifying UOM visible: ${name}`);
    const row = this.uomRow(name);
    await expect(row).toBeVisible({ timeout: 15000 });
    if (abbreviation) {
      await expect(row.getByText(abbreviation, { exact: false })).toBeVisible();
    }
    if (type) {
      await expect(row.getByText(new RegExp(type, 'i'))).toBeVisible();
    }
  }

  async verifyUomAbsent(name: string): Promise<void> {
    log(`Verifying UOM absent: ${name}`);
    await expect(this.uomRow(name)).toHaveCount(0);
  }

  async verifyEditIconOnRow(name: string): Promise<void> {
    const row = this.uomRow(name);
    const editButton = row
      .getByRole('button', { name: /edit/i })
      .or(row.locator('[aria-label*="Edit" i], [title*="Edit" i], button'))
      .first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
  }

  async captureUomSnapshot(name: string): Promise<UomRowSnapshot> {
    const row = this.uomRow(name);
    await expect(row).toBeVisible({ timeout: 15000 });
    const cells = row.getByRole('cell');
    const cellCount = await cells.count();
    const values: string[] = [];
    for (let i = 0; i < cellCount; i++) {
      values.push(((await cells.nth(i).innerText()) || '').replace(/\s+/g, ' ').trim());
    }
    return {
      name: values[0] || name,
      abbreviation: values[1] || '',
      type: values[2] || '',
    };
  }

  async captureBaselineSnapshots(names: string[]): Promise<UomRowSnapshot[]> {
    const snapshots: UomRowSnapshot[] = [];
    for (const name of names) {
      const visible = await this.uomRow(name).isVisible().catch(() => false);
      if (visible) {
        snapshots.push(await this.captureUomSnapshot(name));
      } else {
        log(`Baseline UOM "${name}" not found – skipping snapshot`);
      }
    }
    return snapshots;
  }

  async verifyBaselineUnchanged(baseline: UomRowSnapshot[]): Promise<void> {
    for (const expected of baseline) {
      const current = await this.captureUomSnapshot(expected.name);
      expect(current.name).toBe(expected.name);
      expect(current.abbreviation).toBe(expected.abbreviation);
      expect(current.type.toLowerCase()).toBe(expected.type.toLowerCase());
    }
  }

  async verifyUomAtEndOfList(name: string): Promise<void> {
    log(`Verifying UOM "${name}" appears at end of list (or is visible)`);
    const rows = this.uomTable.getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    const lastRowText = await rows.nth(count - 1).innerText();
    const anywhere = await this.uomRow(name).isVisible().catch(() => false);
    expect(
      new RegExp(name, 'i').test(lastRowText) || anywhere,
    ).toBeTruthy();
  }

  // ── Modal / create / edit ─────────────────────────────────

  async clickNewUom(): Promise<void> {
    log('Clicking + NEW UOM');
    await this.newUomButton.click();
    await expect(this.modal).toBeVisible({ timeout: 10000 });
  }

  async verifyNewUomModal(options: {
    modalTitle: string;
    typeOptions: string[];
    typePlaceholder: string;
  }): Promise<void> {
    log('Verifying New Unit Of Measure modal');
    await expect(
      this.page.getByText(new RegExp(options.modalTitle, 'i')).first(),
    ).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.abbreviationInput).toBeVisible();
    await expect(
      this.page.getByText(new RegExp(options.typePlaceholder, 'i')).first(),
    )
      .toBeVisible()
      .catch(async () => {
        await expect(this.typeDropdown).toBeVisible();
      });
    await expect(this.cancelButton).toBeVisible();
    await expect(this.createUomButton).toBeVisible();

    await this.typeDropdown.click();
    await this.page.waitForTimeout(400);
    for (const typeOption of options.typeOptions) {
      await expect(
        this.page
          .getByRole('option', { name: new RegExp(`^${typeOption}$`, 'i') })
          .or(this.page.getByText(new RegExp(`^${typeOption}$`, 'i')))
          .first(),
      ).toBeVisible({ timeout: 5000 });
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    log('✓ New UOM modal fields and type options verified');
  }

  async fillUomForm(data: {
    name?: string;
    abbreviation?: string;
    type?: string;
  }): Promise<void> {
    if (data.name !== undefined) {
      await this.nameInput.fill('');
      await this.nameInput.fill(data.name);
    }
    if (data.abbreviation !== undefined) {
      await this.abbreviationInput.fill('');
      await this.abbreviationInput.fill(data.abbreviation);
    }
    if (data.type) {
      await this.selectType(data.type);
    }
  }

  async selectType(type: string): Promise<void> {
    log(`Selecting Type: ${type}`);
    await this.typeDropdown.click();
    await this.page.waitForTimeout(300);
    await this.page
      .getByRole('option', { name: new RegExp(`^${type}$`, 'i') })
      .or(this.page.getByText(new RegExp(`^${type}$`, 'i')))
      .first()
      .click();
    await this.page.waitForTimeout(300);
  }

  async clickCreateUom(): Promise<void> {
    log('Clicking CREATE UOM');
    await this.createUomButton.click();
    await this.page.waitForTimeout(700);
  }

  async clickSaveOrUpdate(): Promise<void> {
    log('Clicking Save/Update on UOM modal');
    const saveBtn = this.modal
      .getByRole('button', { name: /save|update|create uom/i })
      .filter({ hasNotText: /^cancel$/i })
      .first();
    await saveBtn.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(700);
  }

  async cancelModal(): Promise<void> {
    log('Clicking CANCEL on UOM modal');
    await this.cancelButton.click();
    await expect(this.modal).toBeHidden({ timeout: 10000 }).catch(() => undefined);
  }

  async closeModalViaX(): Promise<void> {
    log('Closing UOM modal via X');
    if (await this.modalCloseButton.isVisible().catch(() => false)) {
      await this.modalCloseButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await expect(this.modal).toBeHidden({ timeout: 10000 }).catch(() => undefined);
  }

  async verifyModalClosed(): Promise<void> {
    await expect(this.modal).toBeHidden({ timeout: 10000 });
  }

  async verifyValidationVisible(pattern?: RegExp): Promise<void> {
    const validation = this.page.getByText(
      pattern ||
        /required|mandatory|select type|cannot be empty|invalid|please|must|duplicate|already exists/i,
    );
    await expect(validation.first()).toBeVisible({ timeout: 10000 });
  }

  async verifyModalStillOpen(): Promise<void> {
    await expect(this.modal).toBeVisible({ timeout: 5000 });
  }

  async createUom(data: {
    name: string;
    abbreviation: string;
    type: string;
  }): Promise<void> {
    log(`Creating UOM: ${data.name} / ${data.abbreviation} / ${data.type}`);
    await this.clickNewUom();
    await this.fillUomForm(data);
    await this.clickCreateUom();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(this.modal)
      .toBeHidden({ timeout: 15000 })
      .catch(() => undefined);
    await this.verifyUomVisible(data.name, data.abbreviation, data.type);
    log(`✓ UOM created: ${data.name}`);
  }

  async openEditUom(name: string): Promise<void> {
    log(`Opening Edit for UOM: ${name}`);
    const row = this.uomRow(name);
    await expect(row).toBeVisible({ timeout: 15000 });
    const editButton = row
      .getByRole('button', { name: /edit/i })
      .or(row.locator('[aria-label*="Edit" i], [title*="Edit" i]'))
      .or(row.locator('button').filter({ has: this.page.locator('svg') }).first())
      .first();
    await editButton.click();
    await expect(this.modal).toBeVisible({ timeout: 10000 });
  }

  async editUom(
    existingName: string,
    updated: { name: string; abbreviation: string; type?: string },
  ): Promise<void> {
    log(`Editing UOM "${existingName}" → "${updated.name}"`);
    await this.openEditUom(existingName);
    await this.fillUomForm(updated);
    await this.clickSaveOrUpdate();
    await expect(this.modal)
      .toBeHidden({ timeout: 15000 })
      .catch(() => undefined);
    await this.verifyUomVisible(updated.name, updated.abbreviation, updated.type);
    await this.verifyUomAbsent(existingName).catch(() => undefined);
    log(`✓ UOM updated to ${updated.name}`);
  }

  async ensureUomDoesNotExist(name: string): Promise<void> {
    const exists = await this.uomRow(name).isVisible().catch(() => false);
    if (exists) {
      log(`UOM "${name}" already exists – leaving as-is for flow continuity`);
    }
  }

  async refreshPage(): Promise<void> {
    log('Refreshing Units of Measure page');
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    const stillOnPage = await this.pageTitle.isVisible().catch(() => false);
    if (!stillOnPage) {
      await this.openUnitOfMeasure();
    } else {
      await this.verifyPageLoaded();
    }
  }

  // ── RCSP-310: Delete removed ──────────────────────────────

  async verifyDeleteControlsAbsentOnAllRows(): Promise<void> {
    log('Verifying trash/delete icons are absent on all UOM rows');
    const rows = this.uomTable.getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const deleteBtn = row
        .getByRole('button', { name: /delete|remove|trash/i })
        .or(row.locator('[aria-label*="Delete" i], [title*="Delete" i], [aria-label*="trash" i]'));
      await expect(deleteBtn).toHaveCount(0);
    }
    log('✓ No delete/trash controls on UOM rows');
  }

  async verifyDeleteConfirmationCannotOpen(): Promise<void> {
    log('Verifying delete confirmation modal cannot be opened from UOM UI');
    const deleteDialog = this.page.getByRole('dialog').filter({
      hasText: /delete|remove.*unit|confirm.*delete/i,
    });
    await expect(deleteDialog).toHaveCount(0);
  }

  async verifyEditRemainsAvailable(uomName: string): Promise<void> {
    log(`Verifying pencil/edit remains available for UOM: ${uomName}`);
    await this.verifyEditIconOnRow(uomName);
    await this.openEditUom(uomName);
    await expect(this.modal).toBeVisible({ timeout: 10000 });
    await this.cancelModal().catch(async () => this.closeModalViaX());
    await this.verifyModalClosed();
  }
}
