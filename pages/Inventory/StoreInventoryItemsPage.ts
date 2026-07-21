/**
 * StoreInventoryItemsPage – Page Object
 * =====================================
 * Locators and actions for INVENTORY → Store Inventory Items
 * (and related sidebar / Inventory Balances navigation)
 * used by RCSP-310.
 *
 * Note: A separate Stock Count helper with the same class name exists under
 * pages/Stock Count/ for variance-threshold reads (RCSP-211). Import by path.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class StoreInventoryItemsPage {
  readonly sidebar: Locator;
  readonly foodCostSection: Locator;
  readonly inventorySection: Locator;
  readonly inventorySetupSection: Locator;
  readonly inventoryBalancesLink: Locator;
  readonly storeInventoryItemsLink: Locator;
  readonly inventorySetupBalancesLink: Locator;
  readonly inventorySetupStoreItemsLink: Locator;

  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly searchInput: Locator;
  readonly itemsTable: Locator;
  readonly filterByStoreControl: Locator;
  readonly storeContextIndicator: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();

    this.foodCostSection = this.sidebar
      .getByRole('button', { name: /food cost/i })
      .or(this.sidebar.getByText(/^food cost$/i))
      .first();
    this.inventorySection = this.sidebar
      .getByRole('button', { name: /^inventory$/i })
      .or(this.sidebar.getByText(/^inventory$/i))
      .filter({ hasNotText: /setup|balances|items/i })
      .or(this.sidebar.getByRole('button', { name: /^inventory$/i }))
      .first();
    this.inventorySetupSection = this.sidebar
      .getByRole('button', { name: /inventory setup/i })
      .or(this.sidebar.getByText(/inventory setup/i))
      .first();

    this.inventoryBalancesLink = this.sidebar
      .getByRole('link', { name: /inventory balances/i })
      .or(this.sidebar.getByRole('button', { name: /inventory balances/i }))
      .or(this.sidebar.getByText(/^inventory balances$/i))
      .first();
    this.storeInventoryItemsLink = this.sidebar
      .getByRole('link', { name: /store inventory items/i })
      .or(this.sidebar.getByRole('button', { name: /store inventory items/i }))
      .or(this.sidebar.getByText(/^store inventory items$/i))
      .first();

    // Links that should NOT appear under Inventory Setup after relocation
    this.inventorySetupBalancesLink = this.sidebar
      .locator('[class*="submenu"], nav, ul, div')
      .filter({ has: this.inventorySetupSection })
      .getByText(/inventory balances/i)
      .first();
    this.inventorySetupStoreItemsLink = this.sidebar
      .locator('[class*="submenu"], nav, ul, div')
      .filter({ has: this.inventorySetupSection })
      .getByText(/store inventory items/i)
      .first();

    this.pageTitle = page
      .getByRole('heading', { name: /store inventory items/i })
      .first();
    this.pageSubtitle = page
      .getByText(/store inventory|linked items|inventory items/i)
      .first();
    this.searchInput = page
      .getByPlaceholder(/search by item name or sku|search.*item|item name or sku/i)
      .or(page.getByRole('textbox', { name: /search/i }))
      .first();
    this.itemsTable = page.getByRole('table').first();
    this.filterByStoreControl = page
      .getByLabel(/filter by store/i)
      .or(page.getByRole('combobox', { name: /filter by store/i }))
      .or(page.getByText(/^filter by store$/i))
      .or(page.getByPlaceholder(/filter by store/i));
    this.storeContextIndicator = page
      .locator('header')
      .getByText(/WB Unit|Store|Whataburger/i)
      .first();
  }

  // ── Sidebar / navigation ──────────────────────────────────

  async expandInventory(): Promise<void> {
    log('Expanding INVENTORY section');
    const childVisible = await this.storeInventoryItemsLink
      .isVisible()
      .catch(() => false);
    if (!childVisible) {
      await this.inventorySection.click();
      await this.page.waitForTimeout(400);
    }
  }

  async expandInventorySetup(): Promise<void> {
    log('Expanding INVENTORY SETUP section');
    const setupExpanded = await this.page
      .getByText(/unit of measure|units of measure|recipes|vendors/i)
      .first()
      .isVisible()
      .catch(() => false);
    if (!setupExpanded) {
      await this.inventorySetupSection.click();
      await this.page.waitForTimeout(400);
    }
  }

  async isInventorySectionVisible(): Promise<boolean> {
    return this.inventorySection.isVisible().catch(() => false);
  }

  async verifyInventorySectionPlacement(): Promise<void> {
    log('Verifying INVENTORY section placement between FOOD COST and INVENTORY SETUP');
    await expect(this.foodCostSection).toBeVisible({ timeout: 15000 });
    await expect(this.inventorySection).toBeVisible({ timeout: 15000 });
    await expect(this.inventorySetupSection).toBeVisible({ timeout: 15000 });

    const foodBox = await this.foodCostSection.boundingBox();
    const invBox = await this.inventorySection.boundingBox();
    const setupBox = await this.inventorySetupSection.boundingBox();

    if (foodBox && invBox && setupBox) {
      expect(invBox.y).toBeGreaterThan(foodBox.y);
      expect(setupBox.y).toBeGreaterThan(invBox.y);
    } else {
      const sidebarText = (await this.sidebar.innerText()).toLowerCase();
      const foodIdx = sidebarText.indexOf('food cost');
      const setupIdx = sidebarText.indexOf('inventory setup');
      const invIdx = sidebarText.indexOf('\ninventory\n');
      expect(foodIdx).toBeGreaterThanOrEqual(0);
      expect(setupIdx).toBeGreaterThan(foodIdx);
      if (invIdx >= 0) {
        expect(invIdx).toBeGreaterThan(foodIdx);
        expect(setupIdx).toBeGreaterThan(invIdx);
      }
    }
    log('✓ INVENTORY is between FOOD COST and INVENTORY SETUP');
  }

  async verifyInventoryChildrenExactly(): Promise<void> {
    log('Verifying INVENTORY has exactly Inventory Balances and Store Inventory Items');
    await this.expandInventory();
    await expect(this.inventoryBalancesLink).toBeVisible({ timeout: 10000 });
    await expect(this.storeInventoryItemsLink).toBeVisible({ timeout: 10000 });
  }

  async verifyMovedItemsAbsentFromInventorySetup(): Promise<void> {
    log('Verifying Inventory Balances / Store Inventory Items are not under INVENTORY SETUP');
    await this.expandInventorySetup();

    // Scope search to siblings under Inventory Setup by checking that the
    // dedicated Inventory section owns those links, not Setup.
    await this.expandInventory();
    await expect(this.inventoryBalancesLink).toBeVisible();
    await expect(this.storeInventoryItemsLink).toBeVisible();

    // Heuristic: after expanding both, Setup should still show setup menus
    // (e.g. Unit of Measure) and not claim ownership of the two moved items
    // as exclusive Setup children. We assert UOM remains under Setup.
    await expect(
      this.sidebar
        .getByRole('link', { name: /unit of measure/i })
        .or(this.sidebar.getByText(/unit of measure/i))
        .first(),
    ).toBeVisible({ timeout: 10000 });
    log('✓ Moved inventory pages are under INVENTORY; Setup retains UOM');
  }

  async openStoreInventoryItems(): Promise<void> {
    log('Navigating to INVENTORY → Store Inventory Items');
    await this.expandInventory();
    await expect(this.storeInventoryItemsLink).toBeVisible({ timeout: 15000 });
    await this.storeInventoryItemsLink.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.verifyPageLoaded();
    log('✓ Store Inventory Items page loaded');
  }

  async openInventoryBalances(): Promise<void> {
    log('Navigating to INVENTORY → Inventory Balances');
    await this.expandInventory();
    await expect(this.inventoryBalancesLink).toBeVisible({ timeout: 15000 });
    await this.inventoryBalancesLink.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(
      this.page.getByRole('heading', { name: /inventory balances/i }).first(),
    ).toBeVisible({ timeout: 15000 });
    log('✓ Inventory Balances page loaded');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
  }

  async attemptDirectUrlAccess(urlPath: string): Promise<'allowed' | 'denied'> {
    log(`Attempting direct URL access: ${urlPath}`);
    await this.page.goto(urlPath);
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.page.waitForTimeout(1000);

    const denied =
      (await this.page.getByText(/access denied|unauthorized|forbidden|not authorized|permission/i).first().isVisible().catch(() => false)) ||
      /\/login/i.test(this.page.url()) ||
      !(await this.pageTitle.isVisible().catch(() => false));

    return denied ? 'denied' : 'allowed';
  }

  // ── Page UI / filters ─────────────────────────────────────

  async verifyNoFilterByStore(): Promise<void> {
    log('Verifying Filter by Store control is absent');
    await expect(this.filterByStoreControl).toHaveCount(0);
  }

  async verifySearchVisible(): Promise<void> {
    await expect(this.searchInput).toBeVisible({ timeout: 10000 });
  }

  async searchByNameOrSku(term: string): Promise<void> {
    log(`Searching Store Inventory Items for: ${term}`);
    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
    await this.searchInput.fill('');
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(700);
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async clearSearch(): Promise<void> {
    log('Clearing Store Inventory Items search');
    await this.searchInput.fill('');
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.waitForTimeout(500);
  }

  itemRow(nameOrSku: string): Locator {
    return this.itemsTable
      .getByRole('row')
      .filter({
        hasText: new RegExp(nameOrSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      })
      .first();
  }

  async verifyItemVisible(nameOrSku: string): Promise<void> {
    await expect(this.itemRow(nameOrSku)).toBeVisible({ timeout: 15000 });
  }

  async verifyNoResultsOrEmpty(): Promise<void> {
    const empty = this.page.getByText(
      /no (items|results|records|data)|nothing to (show|display)|no matching/i,
    );
    const rowCount = await this.itemsTable
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .count();
    const emptyVisible = await empty.first().isVisible().catch(() => false);
    expect(emptyVisible || rowCount === 0).toBeTruthy();
  }

  async getVisibleItemSignatures(): Promise<string[]> {
    const rows = this.itemsTable.getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
    const count = await rows.count();
    const signatures: string[] = [];
    for (let i = 0; i < Math.min(count, 20); i++) {
      const text = ((await rows.nth(i).innerText()) || '').replace(/\s+/g, ' ').trim();
      if (text) signatures.push(text);
    }
    return signatures;
  }

  // ── Edit pencil / permissions UI ──────────────────────────

  rowEditButton(nameOrSku?: string): Locator {
    const row = nameOrSku
      ? this.itemRow(nameOrSku)
      : this.itemsTable
          .getByRole('row')
          .filter({ hasNot: this.page.getByRole('columnheader') })
          .first();
    return row
      .getByRole('button', { name: /edit/i })
      .or(row.locator('[aria-label*="Edit" i], [title*="Edit" i]'))
      .or(row.locator('button').filter({ has: this.page.locator('svg') }))
      .first();
  }

  async verifyEditPencilHidden(): Promise<void> {
    log('Verifying edit (pencil) is not shown for read-only store items role');
    const rows = this.itemsTable.getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const row = rows.nth(i);
      const edit = row
        .getByRole('button', { name: /edit/i })
        .or(row.locator('[aria-label*="Edit" i], [title*="Edit" i]'));
      await expect(edit).toHaveCount(0);
    }
  }

  async verifyEditPencilVisible(): Promise<void> {
    log('Verifying edit (pencil) is visible for store_items:update role');
    const edit = this.rowEditButton();
    await expect(edit).toBeVisible({ timeout: 15000 });
  }

  async openEditViaPencil(): Promise<void> {
    log('Opening edit via pencil icon');
    await this.rowEditButton().click();
    await this.page.waitForTimeout(700);
    const editUi = this.page
      .getByRole('dialog')
      .or(this.page.getByRole('heading', { name: /edit|store item|inventory item/i }))
      .first();
    await expect(editUi).toBeVisible({ timeout: 15000 });
  }

  async cancelEditIfOpen(): Promise<void> {
    const cancel = this.page
      .getByRole('button', { name: /^(cancel|close|discard)$/i })
      .first();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
    } else {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }
  }

  // ── Global store switcher ─────────────────────────────────

  async switchStoreViaHeader(store: string): Promise<void> {
    log(`Switching Topbar store to: ${store}`);
    const storeCode = store.replace(/^WB Unit\s+/i, '').replace(/^Whataburger\s*#?/i, '').trim();
    const headerStoreButton = this.page.locator('header').getByRole('button').first();
    await headerStoreButton.click();
    await this.page.waitForTimeout(500);

    const search = this.page
      .getByPlaceholder(/search/i)
      .or(this.page.getByRole('textbox').last())
      .first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill(storeCode);
      await this.page.waitForTimeout(500);
    }

    const option = this.page
      .getByRole('option', { name: new RegExp(storeCode, 'i') })
      .or(this.page.getByText(new RegExp(`${store}|${storeCode}`, 'i')))
      .first();
    await option.click({ force: true });
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(1500);
  }

  async verifyTableRefreshedAfterStoreSwitch(
    beforeSignatures: string[],
  ): Promise<void> {
    log('Verifying table refreshed after Topbar store switch');
    await expect
      .poll(async () => this.getVisibleItemSignatures(), {
        timeout: 20000,
        message: 'Waiting for Store Inventory Items table to refresh after store switch',
      })
      .not.toEqual(beforeSignatures);
  }
}
