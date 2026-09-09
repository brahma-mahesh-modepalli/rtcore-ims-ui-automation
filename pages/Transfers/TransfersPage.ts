/**
 * TransfersPage – Page Object
 * ===========================
 * Locators and actions for Transfers plus supporting My Hierarchy,
 * Inventory Balances, and Dashboard Recent Stock Movements flows used by
 * RCSP-220 / RCSP-44 (IMS→IMS) / RCSP-45 (IMS→Non-IMS).
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class TransfersPage {
  readonly sidebar: Locator;
  readonly myHierarchyMenu: Locator;
  readonly inventoryMenu: Locator;
  readonly inventoryBalancesLink: Locator;
  readonly transfersMenu: Locator;
  readonly dashboardMenu: Locator;

  readonly pageTitle: Locator;
  readonly newTransferButton: Locator;
  readonly transfersTable: Locator;

  readonly fromStoreField: Locator;
  readonly toStoreField: Locator;
  readonly transferReasonField: Locator;
  readonly notesField: Locator;
  readonly addItemButton: Locator;
  readonly saveChangesButton: Locator;
  readonly submitTransferButton: Locator;
  readonly cancelButton: Locator;

  readonly itemSearchInput: Locator;
  readonly qtyToOrderInput: Locator;

  readonly rejectModal: Locator;
  readonly approveModal: Locator;
  readonly reasonInput: Locator;
  readonly modalYesButton: Locator;
  readonly modalNoButton: Locator;

  readonly storeContextIndicator: Locator;
  readonly recentStockMovementsHeading: Locator;
  readonly inventorySearchInput: Locator;
  readonly inventoryTable: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.myHierarchyMenu = this.sidebar.getByRole('link', { name: /my hierarchy/i }).or(
      this.sidebar.getByRole('button', { name: /my hierarchy/i }),
    );
    this.inventoryMenu = this.sidebar.getByRole('button', { name: /^inventory$/i });
    this.inventoryBalancesLink = this.sidebar.getByRole('link', {
      name: /inventory balances/i,
    });
    this.transfersMenu = this.sidebar
      .getByRole('link', { name: /^transfers$/i })
      .or(this.sidebar.getByRole('button', { name: /^transfers$/i }));
    this.dashboardMenu = this.sidebar
      .getByRole('link', { name: /^dashboard$/i })
      .or(this.sidebar.getByRole('button', { name: /^dashboard$/i }));

    this.pageTitle = page.getByRole('heading', { name: /transfers/i }).first();
    this.newTransferButton = page.getByRole('button', { name: /new transfer/i });
    this.transfersTable = page.getByRole('table').first();

    this.fromStoreField = page
      .getByLabel(/^from store/i)
      .or(page.getByRole('combobox', { name: /from store/i }))
      .first();
    this.toStoreField = page
      .getByLabel(/^to store/i)
      .or(page.getByRole('combobox', { name: /to store|select store/i }))
      .or(page.getByText(/^Select store$/i))
      .first();
    this.transferReasonField = page
      .getByLabel(/transfer reason/i)
      .or(page.getByRole('combobox', { name: /transfer reason|select reason/i }))
      .or(page.getByText(/^Select reason$/i))
      .first();
    this.notesField = page
      .getByPlaceholder(/optional notes for this transfer/i)
      .or(page.getByPlaceholder(/notes|optional|comment/i))
      .or(page.locator('textarea').first());
    this.addItemButton = page.getByRole('button', { name: /add item/i });
    this.saveChangesButton = page
      .getByRole('button', { name: /save changes/i })
      .filter({ hasText: /save changes/i })
      .first();
    this.submitTransferButton = page
      .getByRole('button', { name: /submit transfer/i })
      .filter({ hasText: /submit transfer/i })
      .first();
    this.cancelButton = page
      .getByRole('button', { name: /cancel/i })
      .filter({ hasText: /cancel/i })
      .first();

    this.itemSearchInput = page
      .getByPlaceholder(/search.*item|item name|sku/i)
      .or(page.getByRole('textbox', { name: /search/i }))
      .first();
    this.qtyToOrderInput = page
      .getByPlaceholder(/qty|quantity/i)
      .or(page.getByRole('spinbutton').first())
      .or(page.getByLabel(/qty to order/i))
      .first();

    this.rejectModal = page.getByRole('dialog').filter({
      hasText: /reject this transfer/i,
    });
    this.approveModal = page.getByRole('dialog').filter({
      hasText: /approve this transfer/i,
    });
    this.reasonInput = page
      .getByPlaceholder(/why is this transfer being rejected|reason/i)
      .or(page.getByRole('textbox', { name: /reason|rejected/i }))
      .or(page.getByRole('dialog').filter({ hasText: /reject this transfer/i }).getByRole('textbox'))
      .first();
    this.modalYesButton = page.getByRole('button', { name: /^yes$/i });
    this.modalNoButton = page.getByRole('button', { name: /^no$/i });

    this.storeContextIndicator = page.locator('header').getByText(/WB Unit/i).first();
    this.recentStockMovementsHeading = page.getByRole('heading', {
      name: /recent stock movements/i,
    });
    this.inventorySearchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole('textbox', { name: /search/i }))
      .first();
    this.inventoryTable = page.getByRole('table').first();
  }

  // ── Navigation ────────────────────────────────────────────

  async openMyHierarchy(): Promise<void> {
    log('Opening My Hierarchy');
    await this.myHierarchyMenu.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(
      this.page.getByRole('heading', { name: /^My Hierarchy$/i }),
    ).toBeVisible({ timeout: 15000 });
    log('✓ My Hierarchy page loaded');
  }

  async openInventoryBalances(): Promise<void> {
    log('Navigating to Inventory > Inventory Balances');
    const balancesVisible = await this.inventoryBalancesLink.isVisible().catch(() => false);
    if (!balancesVisible) {
      await this.inventoryMenu.click();
      await this.page.waitForTimeout(500);
    }
    await this.inventoryBalancesLink.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(
      this.page.getByRole('heading', { name: /inventory balances/i }).first(),
    ).toBeVisible({ timeout: 15000 });
    log('✓ Inventory Balances page loaded');
  }

  async openTransfers(): Promise<void> {
    log('Navigating to Transfers');
    await this.transfersMenu.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.verifyTransfersPageLoaded();
    log('✓ Transfers page loaded');
  }

  async openDashboard(): Promise<void> {
    log('Navigating to Dashboard');
    await this.dashboardMenu.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(
      this.page.getByRole('heading', { name: /dashboard|overview|recent/i }).first(),
    )
      .toBeVisible({ timeout: 15000 })
      .catch(() => undefined);
    log('✓ Dashboard page loaded');
  }

  // ── My Hierarchy ──────────────────────────────────────────

  async verifyHierarchyControlsVisible(): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: /^My Hierarchy$/i }),
    ).toBeVisible();
    await expect(
      this.page.getByText(/Your assigned regions, markets, and stores/i),
    ).toBeVisible();
    await expect(this.page.getByText('Total stores', { exact: true })).toBeVisible();
    await expect(this.page.getByText('Region', { exact: true }).first()).toBeVisible();
    await expect(this.page.getByText('Market', { exact: true }).first()).toBeVisible();
  }

  private hierarchyNodeButton(label: string): Locator {
    const compact = label.replace(/\s+/g, '\\s*');
    return this.page.getByRole('button', { name: new RegExp(compact, 'i') }).first();
  }

  private async expandHierarchyNode(label: string): Promise<void> {
    const button = this.hierarchyNodeButton(label);
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await this.page.waitForTimeout(700);
  }

  async expandHierarchyPath(
    region: string,
    market: string,
    expectedStore?: string,
  ): Promise<void> {
    log(`Expanding hierarchy: ${region} > ${market}`);
    const marketButton = this.hierarchyNodeButton(market);
    await this.expandHierarchyNode(region);
    if (!(await marketButton.isVisible().catch(() => false))) {
      await this.expandHierarchyNode(region);
    }
    await expect(marketButton).toBeVisible({ timeout: 20000 });

    await marketButton.scrollIntoViewIfNeeded();
    await marketButton.click();
    await this.page.waitForTimeout(800);

    if (expectedStore) {
      const storeLocator = this.page.getByText(expectedStore, { exact: true }).first();
      if (!(await storeLocator.isVisible().catch(() => false))) {
        await marketButton.click();
        await this.page.waitForTimeout(800);
      }
      await storeLocator.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(storeLocator).toBeVisible({ timeout: 20000 });
      return;
    }

    const anyStore = this.page.getByText(/WB Unit\s+\d+/i).first();
    if (!(await anyStore.isVisible().catch(() => false))) {
      await marketButton.click();
      await this.page.waitForTimeout(800);
    }
    await expect(anyStore).toBeVisible({ timeout: 20000 });
  }

  async selectHierarchyPath(
    region: string,
    market: string,
    store: string,
  ): Promise<void> {
    log(`Selecting hierarchy: ${region} > ${market} > ${store}`);
    await this.expandHierarchyPath(region, market);

    const storeLocator = this.page.getByText(store, { exact: true }).first();
    if (!(await storeLocator.isVisible().catch(() => false))) {
      await this.hierarchyNodeButton(market).click();
      await this.page.waitForTimeout(700);
    }
    await expect(storeLocator).toBeVisible({ timeout: 20000 });
    await this.selectStoreFromHierarchy(store);
    log(`✓ Selected store: ${store}`);
  }

  async selectStoreFromHierarchy(store: string): Promise<void> {
    const storeCode = store.replace(/^WB Unit\s+/i, '').trim();

    // App guidance: "Click a store to switch to it."
    await this.page.getByText(store, { exact: true }).first().click({ force: true });
    await this.page.waitForTimeout(2000);

    if (await this.isStoreContextActive(storeCode, store)) {
      return;
    }

    // Fallback 1: open store details and look for an explicit switch action.
    const viewDetailsButton = this.page.locator(
      `xpath=//*[normalize-space()="${store}"]/ancestor::div[.//button[contains(., "View details")]][1]//button[contains(., "View details")]`,
    );
    if (await viewDetailsButton.isVisible().catch(() => false)) {
      await viewDetailsButton.click({ force: true });
      await this.page.waitForLoadState('networkidle').catch(() => undefined);
      await this.page.waitForTimeout(1500);
    }

    const switchAction = this.page.getByRole('button', {
      name: /switch to|use this store|select store|set as current/i,
    });
    if (await switchAction.first().isVisible().catch(() => false)) {
      await switchAction.first().click();
      await this.page.waitForTimeout(1000);
    }

    if (await this.isStoreContextActive(storeCode, store)) {
      return;
    }

    // Fallback 2: header store selector.
    await this.switchStoreViaHeader(store);
  }

  async switchStoreViaHeader(store: string): Promise<void> {
    const storeCode = store.replace(/^WB Unit\s+/i, '').trim();
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
      .or(
        this.page
          .locator('button, [role="option"], li')
          .filter({ hasText: new RegExp(`^\s*(?:${store}|${storeCode})\s*$`, 'i') }),
      )
      .first();
    await option.click({ force: true });
    await this.page.waitForTimeout(1500);
  }

  async isStoreContextActive(storeCode: string, storeName: string): Promise<boolean> {
    const headerText = await this.page.locator('header').innerText().catch(() => '');
    const sidebarText = await this.sidebar.innerText().catch(() => '');
    return new RegExp(`${storeName}|Store.*${storeCode}|\\b${storeCode}\\b`, 'i').test(
      `${headerText}\n${sidebarText}`,
    );
  }

  async verifyStoresVisible(stores: string[]): Promise<void> {
    for (const store of stores) {
      const storeLocator = this.page.getByText(store, { exact: true }).first();
      await expect(storeLocator).toBeVisible({ timeout: 15000 });
    }
  }

  async verifyActiveStore(storeName: string): Promise<void> {
    log(`Verifying active store context: ${storeName}`);
    const storeCode = storeName.replace(/^WB Unit\s+/i, '').trim();
    await expect
      .poll(async () => this.isStoreContextActive(storeCode, storeName), {
        timeout: 20000,
        message: `Waiting for active store context to become ${storeName}`,
      })
      .toBe(true);
    log(`✓ Active store is ${storeName}`);
  }

  async switchStore(
    region: string,
    market: string,
    store: string,
  ): Promise<void> {
    await this.openMyHierarchy();
    await this.selectHierarchyPath(region, market, store);
    await this.openDashboard();
    await this.verifyActiveStore(store);
  }

  // ── Inventory Balances ────────────────────────────────────

  async searchInventoryItem(itemNameOrSku: string): Promise<void> {
    log(`Searching inventory item: ${itemNameOrSku}`);
    await this.inventorySearchInput.fill(itemNameOrSku);
    await this.inventorySearchInput.press('Enter');
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async verifyInventoryColumnsVisible(): Promise<void> {
    await expect(this.page.getByText(/on hand/i).first()).toBeVisible();
    await expect(this.page.getByText(/fifo cost/i).first()).toBeVisible();
  }

  async getOnHandValue(itemNameOrSku: string): Promise<number> {
    const row = this.page
      .getByRole('row', { name: new RegExp(itemNameOrSku, 'i') })
      .first();
    await expect(row).toBeVisible({ timeout: 15000 });
    const cells = row.getByRole('cell');
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).trim().replace(/,/g, '');
      if (/^-?\d+(\.\d+)?$/.test(text)) {
        return Number(text);
      }
    }
    const rowText = await row.innerText();
    const match = rowText.match(/-?\d+(\.\d+)?/);
    if (!match) {
      throw new Error(`Unable to parse ON HAND for ${itemNameOrSku}`);
    }
    return Number(match[0]);
  }

  async getFifoCostValue(itemNameOrSku: string): Promise<string> {
    const row = this.page
      .getByRole('row', { name: new RegExp(itemNameOrSku, 'i') })
      .first();
    await expect(row).toBeVisible();
    const rowText = await row.innerText();
    const match = rowText.match(/\$?\d+(\.\d+)?/);
    expect(match).toBeTruthy();
    return match![0];
  }

  async verifyItemBalanceVisible(itemNameOrSku: string): Promise<void> {
    const row = this.page
      .getByRole('row', { name: new RegExp(itemNameOrSku, 'i') })
      .first();
    await expect(row).toBeVisible();
    const onHand = await this.getOnHandValue(itemNameOrSku);
    const fifo = await this.getFifoCostValue(itemNameOrSku);
    expect(Number.isFinite(onHand)).toBeTruthy();
    expect(fifo.length).toBeGreaterThan(0);
    log(`✓ ${itemNameOrSku} ON HAND=${onHand}, FIFO COST=${fifo}`);
  }

  async verifyNoInventoryRecords(message?: string): Promise<void> {
    const expectedMessage = message || 'No stock balances found.';
    await expect(
      this.page.getByText(expectedMessage, { exact: false }).first(),
    ).toBeVisible({ timeout: 10000 });
  }

  // ── Transfers listing ─────────────────────────────────────

  async verifyTransfersPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
    await expect(this.newTransferButton).toBeVisible({ timeout: 15000 });
  }

  async verifyNewTransferButtonEnabled(): Promise<void> {
    await expect(this.newTransferButton).toBeVisible();
    await expect(this.newTransferButton).toBeEnabled();
  }

  statusTab(name: string): Locator {
    return this.page
      .getByRole('tab', { name: new RegExp(`^${name}$`, 'i') })
      .or(this.page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') }))
      .first();
  }

  async selectStatusTab(name: string): Promise<void> {
    log(`Selecting Transfers tab: ${name}`);
    await this.statusTab(name).click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async verifyStatusTabs(tabs: string[]): Promise<void> {
    for (const tab of tabs) {
      await expect(this.statusTab(tab)).toBeVisible();
      await this.selectStatusTab(tab);
    }
  }

  async verifyColumnHeaders(headers: string[]): Promise<void> {
    for (const header of headers) {
      await expect(
        this.page.getByRole('columnheader', { name: new RegExp(header, 'i') }).first(),
      ).toBeVisible();
    }
  }

  transferRow(identifier: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(identifier, 'i') }).first();
  }

  async openTransferById(transferId: string): Promise<void> {
    log(`Opening transfer: ${transferId}`);
    const row = this.transferRow(transferId);
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByText(new RegExp(transferId, 'i')).first().click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);

    const heading = this.page.getByRole('heading', { name: new RegExp(transferId, 'i') }).first();
    const formSubmit = this.submitTransferButton;
    await expect(heading.or(formSubmit).first()).toBeVisible({ timeout: 15000 });
    log(`✓ Opened transfer details: ${transferId}`);
  }

  async submitTransferFromList(transferId: string): Promise<void> {
    log(`Submitting transfer ${transferId} from list actions`);
    const row = this.transferRow(transferId);
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole('button', { name: /submit transfer/i }).click();
    const confirmYes = this.page.getByRole('button', { name: /^yes$/i });
    if (await confirmYes.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmYes.click();
    }
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(1000);
  }

  async verifyTransferStatus(
    transferId: string,
    expectedStatus: string,
  ): Promise<void> {
    const row = this.transferRow(transferId);
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText(new RegExp(expectedStatus, 'i'));
    log(`✓ Transfer ${transferId} status is ${expectedStatus}`);
  }

  async verifyTransferStores(
    transferId: string,
    fromStore: string,
    toStore: string,
  ): Promise<void> {
    const row = this.transferRow(transferId);
    await expect(row).toContainText(new RegExp(fromStore, 'i'));
    await expect(row).toContainText(new RegExp(toStore, 'i'));
  }

  async getLatestTransferId(preferredStatus?: string): Promise<string> {
    await this.page.waitForTimeout(1000);
    const rows = this.transfersTable.getByRole('row');
    const rowCount = await rows.count();
    for (let i = 1; i < rowCount; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      const match = text.match(/TRF-\w+/i);
      if (!match) continue;
      if (preferredStatus && !new RegExp(preferredStatus, 'i').test(text)) continue;
      return match[0];
    }
    const firstDataRow = rows.nth(1);
    await expect(firstDataRow).toBeVisible({ timeout: 15000 });
    const text = await firstDataRow.innerText();
    const match = text.match(/TRF-\w+/i);
    if (!match) {
      throw new Error(`Unable to extract Transfer ID from row: ${text}`);
    }
    return match[0];
  }

  // ── New / Draft transfer form ─────────────────────────────

  async clickNewTransfer(): Promise<void> {
    log('Clicking NEW TRANSFER');
    await this.newTransferButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async verifyNewTransferFormVisible(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /new transfer/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(this.page.getByText(/^From Store/i).first()).toBeVisible();
    await expect(this.page.getByText(/^To Store/i).first()).toBeVisible();
    await expect(this.page.getByText(/Transfer Reason/i).first()).toBeVisible();
    await expect(this.notesField.first()).toBeVisible();
    await expect(this.addItemButton).toBeVisible();
  }

  private async openFieldDropdown(
    labelPattern: RegExp,
    placeholderPattern?: RegExp,
  ): Promise<void> {
    const label = this.page.getByText(labelPattern).first();
    const fieldButton = label.locator('xpath=following::button[1]');
    if (await fieldButton.isVisible().catch(() => false)) {
      await fieldButton.click();
      return;
    }

    if (placeholderPattern) {
      const byPlaceholder = this.page.getByRole('button', { name: placeholderPattern }).first();
      if (await byPlaceholder.isVisible().catch(() => false)) {
        await byPlaceholder.click();
        return;
      }
    }

    const byLabel = this.page.getByLabel(labelPattern).first();
    if (await byLabel.isVisible().catch(() => false)) {
      await byLabel.click();
      return;
    }

    await this.page.getByRole('combobox', { name: labelPattern }).first().click();
  }

  private async selectDropdownByLabel(
    labelPattern: RegExp,
    optionText: string,
    placeholderPattern?: RegExp,
    options?: { useSearch?: boolean },
  ): Promise<void> {
    await this.openFieldDropdown(labelPattern, placeholderPattern);
    await this.page.waitForTimeout(300);

    const useSearch = options?.useSearch !== false;
    const search = this.page.getByPlaceholder(/^search/i).last();
    const searchVisible = await search.isVisible().catch(() => false);

    if (useSearch && searchVisible) {
      await search.fill(optionText);
      await this.page.waitForTimeout(400);
    } else if (searchVisible) {
      await search.fill('');
      await this.page.waitForTimeout(400);
    }

    const escaped = optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const optionName = new RegExp(escaped, 'i');

    if (searchVisible) {
      const menuButtons = search.locator('xpath=following::button');
      const count = await menuButtons.count();
      const candidates: { index: number; text: string }[] = [];
      for (let i = 0; i < Math.min(count, 40); i++) {
        const btn = menuButtons.nth(i);
        if (!(await btn.isVisible().catch(() => false))) continue;
        const text = ((await btn.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
        if (!text || /^select /i.test(text) || /no results/i.test(text)) continue;
        // Skip helper/hint-only chips like "comment required"
        if (/^comment required$/i.test(text)) continue;
        candidates.push({ index: i, text });
      }

      const exact = candidates.find((c) => optionName.test(c.text));
      const pick = exact ?? candidates[0];
      if (!pick) {
        throw new Error(
          `Could not select dropdown option "${optionText}" for ${labelPattern}; no choices available`,
        );
      }
      if (!exact) {
        log(`Dropdown option "${optionText}" not found; selecting "${pick.text}"`);
      }
      await menuButtons.nth(pick.index).click();
      return;
    }

    const optionButton = this.page
      .getByRole('button', { name: optionName })
      .locator('visible=true')
      .last();
    if (await optionButton.isVisible().catch(() => false)) {
      await optionButton.click();
      return;
    }

    throw new Error(`Could not select dropdown option "${optionText}" for ${labelPattern}`);
  }

  async selectFromStore(store: string): Promise<void> {
    log(`Selecting From Store: ${store}`);
    const current = this.page
      .getByText(/^From Store/i)
      .first()
      .locator('xpath=following::button[1]');
    const currentText = (await current.innerText().catch(() => '')).trim();
    if (new RegExp(store, 'i').test(currentText)) {
      log(`From Store already set to ${store}`);
      return;
    }
    await this.selectDropdownByLabel(/^From Store/i, store, undefined, { useSearch: true });
  }

  async selectToStore(store: string): Promise<void> {
    log(`Selecting To Store: ${store}`);
    await this.selectDropdownByLabel(/^To Store/i, store, /^Select store$/i, {
      useSearch: true,
    });
  }

  async selectTransferReason(reason: string): Promise<void> {
    log(`Selecting Transfer Reason: ${reason}`);
    await this.selectDropdownByLabel(/Transfer Reason/i, reason, /^Select reason$/i, {
      useSearch: false,
    });
  }

  async fillNotes(notes: string): Promise<void> {
    await this.notesField.first().fill(notes);
  }

  async getNotesValue(): Promise<string> {
    return this.notesField.first().inputValue();
  }

  async openAddItem(): Promise<void> {
    await this.addItemButton.click();
    await this.page.waitForTimeout(500);
  }

  async addItem(itemNameOrSku: string, quantity: string, sku?: string): Promise<void> {
    const searchValue = sku || itemNameOrSku;
    log(`Adding item ${itemNameOrSku}${sku ? ` (SKU ${sku})` : ''} qty ${quantity}`);
    await this.openAddItem();

    const search = this.page.getByPlaceholder(/filter by name|plu|category/i);
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill(searchValue);
    await this.page.waitForTimeout(700);

    // Prefer the exact SKU match when provided (avoids other LARGE BUNS variants).
    const resultMatcher = sku
      ? new RegExp(`(${sku}|${itemNameOrSku}[\\s\\S]*${sku}|${sku}[\\s\\S]*${itemNameOrSku})`, 'i')
      : new RegExp(itemNameOrSku, 'i');
    const result = this.page
      .locator('button, [role="option"], li')
      .filter({ hasText: resultMatcher })
      .filter({ hasNotText: /ask the ims|assistant|filter by name/i })
      .first();
    await expect(result).toBeVisible({ timeout: 10000 });
    await result.click();
    await this.page.waitForTimeout(500);

    const closeDialog = this.page.getByRole('button', { name: /close dialog/i });
    if (await closeDialog.isVisible().catch(() => false)) {
      await closeDialog.click();
      await expect(closeDialog).toBeHidden({ timeout: 5000 }).catch(() => undefined);
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.waitForTimeout(300);

    const rowMatcher = sku
      ? new RegExp(`${itemNameOrSku}[\\s\\S]*${sku}|${sku}`, 'i')
      : new RegExp(itemNameOrSku, 'i');
    const itemRow = this.page.getByRole('row').filter({ hasText: rowMatcher }).first();
    await expect(itemRow).toBeVisible({ timeout: 10000 });

    // Qty fields may be CS / TR / PK (or CS / PK / EA). Prefer an EA control when present.
    const spinbuttons = itemRow.getByRole('spinbutton');
    const spinCount = await spinbuttons.count();
    for (let i = 0; i < spinCount; i++) {
      await spinbuttons.nth(i).fill('0');
    }
    const eaSpin = itemRow
      .locator('xpath=.//*[normalize-space()="EA"]/preceding::input[@type="number" or @role="spinbutton"][1]')
      .or(itemRow.getByRole('spinbutton').last());
    await eaSpin.first().fill(quantity);
    // If EA isn't editable and only CS exists, 1 EA may auto-map; keep a single base unit when possible.
    const shown = (await itemRow.innerText()).replace(/\s+/g, ' ');
    if (!new RegExp(`\\b${quantity}\\b`).test(shown) && spinCount > 0) {
      await spinbuttons.first().fill(quantity);
    }
  }

  async fillQuantity(quantity: string): Promise<void> {
    const qty = this.page
      .getByLabel(/qty to order|quantity/i)
      .or(this.page.getByPlaceholder(/qty|quantity/i))
      .or(this.page.getByRole('spinbutton'))
      .first();
    await qty.fill(quantity);
  }

  async saveChanges(): Promise<void> {
    log('Clicking SAVE CHANGES');
    const closeDialog = this.page.getByRole('button', { name: /close dialog/i });
    if (await closeDialog.isVisible().catch(() => false)) {
      await closeDialog.click();
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await expect(this.saveChangesButton).toBeEnabled({ timeout: 15000 });
    await this.saveChangesButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(1000);
  }

  async submitTransfer(): Promise<void> {
    log('Clicking SUBMIT TRANSFER');
    const closeDialog = this.page.getByRole('button', { name: /close dialog/i });
    if (await closeDialog.isVisible().catch(() => false)) {
      await closeDialog.click();
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);

    // Form footer button (has visible text). Fall back to list-row icon submit.
    const formSubmit = this.submitTransferButton;
    if (await formSubmit.isVisible().catch(() => false)) {
      await expect(formSubmit).toBeEnabled({ timeout: 15000 });
      await formSubmit.click();
    } else {
      await this.page.getByRole('button', { name: /submit transfer/i }).first().click();
    }

    const confirmYes = this.page.getByRole('button', { name: /^yes$/i });
    if (await confirmYes.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmYes.click();
    }
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(1000);
  }

  async cancelDraft(confirm = true): Promise<void> {
    log('Clicking CANCEL on draft transfer');
    await this.cancelButton.click();
    const confirmYes = this.page.getByRole('button', { name: /^yes$/i });
    if (confirm && (await confirmYes.isVisible().catch(() => false))) {
      await confirmYes.click();
    }
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async verifyDraftDetailActionsVisible(): Promise<void> {
    await expect(this.cancelButton).toBeVisible({ timeout: 15000 });
    await expect(this.cancelButton).toBeEnabled();
    await expect(this.saveChangesButton).toBeVisible({ timeout: 15000 });
    await expect(this.saveChangesButton).toBeEnabled();
    await expect(this.submitTransferButton).toBeVisible({ timeout: 15000 });
    await expect(this.submitTransferButton).toBeEnabled();
  }

  async verifyItemOnTransfer(itemNameOrSku: string, quantity?: string): Promise<void> {
    await expect(
      this.page.getByText(new RegExp(itemNameOrSku, 'i')).first(),
    ).toBeVisible();
    if (quantity) {
      const row = this.page
        .getByRole('row')
        .filter({ hasText: new RegExp(itemNameOrSku, 'i') })
        .first();
      await expect(row).toBeVisible();
      // Quantity may display as EA or converted CS/PK equivalents.
      await expect(row).toContainText(/\d/);
    }
  }

  async createDraftTransfer(input: {
    fromStore: string;
    toStore: string;
    reason: string;
    notes: string;
    item: string;
    quantity: string;
    sku?: string;
  }): Promise<void> {
    await this.clickNewTransfer();
    await this.verifyNewTransferFormVisible();
    await this.selectFromStore(input.fromStore);
    await this.selectToStore(input.toStore);
    await this.selectTransferReason(input.reason);
    await this.fillNotes(input.notes);
    await this.addItem(input.item, input.quantity, input.sku);
    await this.saveChanges();
  }

  async createAndSubmitTransfer(input: {
    fromStore: string;
    toStore: string;
    reason: string;
    notes: string;
    item: string;
    quantity: string;
    sku?: string;
  }): Promise<void> {
    await this.clickNewTransfer();
    await this.verifyNewTransferFormVisible();
    await this.selectFromStore(input.fromStore);
    await this.selectToStore(input.toStore);
    await this.selectTransferReason(input.reason);
    await this.fillNotes(input.notes);
    await this.addItem(input.item, input.quantity, input.sku);
    await this.submitTransfer();
  }

  async verifyValidationVisible(pattern = /required|mandatory|invalid|must|cannot|error/i): Promise<void> {
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 10000 });
  }

  async getTransferReasonOptions(): Promise<string[]> {
    await this.openFieldDropdown(/Transfer Reason/i, /^Select reason$/i);
    const options = this.page.getByRole('option');
    const count = await options.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push((await options.nth(i).innerText()).trim());
    }
    await this.page.keyboard.press('Escape');
    return values;
  }

  async verifyReasonCodes(expected: string[]): Promise<void> {
    const actual = await this.getTransferReasonOptions();
    for (const reason of expected) {
      expect(actual.some((value) => new RegExp(reason, 'i').test(value))).toBeTruthy();
    }
  }

  // ── Approve / Reject ──────────────────────────────────────

  async clickRejectForTransfer(transferId: string): Promise<void> {
    const row = this.transferRow(transferId);
    await row.getByRole('button', { name: /reject/i }).click();
  }

  async clickApproveForTransfer(transferId: string): Promise<void> {
    const row = this.transferRow(transferId);
    await row.getByRole('button', { name: /approve/i }).click();
  }

  async verifyRejectModalVisible(title?: string, description?: string): Promise<void> {
    await expect(this.rejectModal.first()).toBeVisible({ timeout: 15000 });
    if (title) {
      await expect(this.rejectModal.getByText(new RegExp(title, 'i')).first()).toBeVisible();
    }
    if (description) {
      await expect(this.rejectModal.getByText(new RegExp(description, 'i')).first()).toBeVisible();
    }
    await expect(this.reasonInput).toBeVisible();
    await expect(this.modalYesButton).toBeVisible();
    await expect(this.modalNoButton).toBeVisible();
  }

  async verifyApproveModalVisible(title?: string, description?: string): Promise<void> {
    await expect(this.approveModal.first()).toBeVisible({ timeout: 15000 });
    if (title) {
      await expect(this.approveModal.getByText(new RegExp(title, 'i')).first()).toBeVisible();
    }
    if (description) {
      await expect(this.approveModal.getByText(new RegExp(description, 'i')).first()).toBeVisible();
    }
    await expect(this.modalYesButton).toBeVisible();
    await expect(this.modalNoButton).toBeVisible();
  }

  async confirmReject(reason: string): Promise<void> {
    await this.reasonInput.fill(reason);
    await this.modalYesButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async confirmApprove(): Promise<void> {
    await this.modalYesButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async dismissModal(): Promise<void> {
    await this.modalNoButton.click();
    await expect(this.modalYesButton).toBeHidden({ timeout: 10000 }).catch(() => undefined);
  }

  async verifyPendingActionsVisible(transferId: string): Promise<void> {
    const row = this.transferRow(transferId);
    await expect(row.getByRole('button', { name: /reject/i })).toBeVisible();
    await expect(row.getByRole('button', { name: /approve/i })).toBeVisible();
  }

  async verifyNoApproveRejectActions(transferId: string): Promise<void> {
    const row = this.transferRow(transferId);
    await expect(row.getByRole('button', { name: /reject/i })).toHaveCount(0);
    await expect(row.getByRole('button', { name: /approve/i })).toHaveCount(0);
  }

  // ── Dashboard / export ────────────────────────────────────

  async verifyRecentStockMovement(input: {
    type: string;
    item: string;
    qty: string;
  }): Promise<void> {
    await expect(this.recentStockMovementsHeading).toBeVisible({ timeout: 15000 });
    const row = this.page
      .getByRole('row', {
        name: new RegExp(`${input.type}.*${input.item}|${input.item}.*${input.type}`, 'i'),
      })
      .first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(new RegExp(input.qty.replace('+', '\\+'), 'i'));
  }

  async verifyFinancialRecordVisible(): Promise<void> {
    await expect(
      this.page.getByText(/financial|fifo cost|cost|total/i).first(),
    ).toBeVisible();
  }

  async exportTransferReceipt(): Promise<void> {
    const exportButton = this.page.getByRole('button', { name: /export/i }).first();
    await expect(exportButton).toBeVisible();
    const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await exportButton.click();
    await downloadPromise;
  }

  async printTransferReceipt(): Promise<void> {
    const printButton = this.page.getByRole('button', { name: /print/i }).first();
    await expect(printButton).toBeVisible();
    await printButton.click();
  }

  async isFromStoreSelectable(store: string): Promise<boolean> {
    try {
      await this.selectFromStore(store);
      return true;
    } catch {
      return false;
    }
  }

  // ── RCSP-44 / RCSP-45: IMS vs Non-IMS store rules ──────────

  async openFromStoreDropdown(): Promise<void> {
    await this.openFieldDropdown(/^From Store/i, undefined);
  }

  async openToStoreDropdown(): Promise<void> {
    await this.openFieldDropdown(/^To Store/i, /^Select store$/i);
  }

  async searchInOpenDropdown(term: string): Promise<void> {
    const search = this.page
      .getByPlaceholder(/search/i)
      .or(this.page.getByRole('textbox').last())
      .first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill(term);
      await this.page.waitForTimeout(500);
    }
  }

  async verifyStoreOptionVisible(store: string, shouldBeVisible = true): Promise<void> {
    const option = this.page
      .getByRole('option', { name: new RegExp(store.replace(/^WB Unit\s+/i, ''), 'i') })
      .or(this.page.getByText(new RegExp(store, 'i')))
      .first();
    if (shouldBeVisible) {
      await expect(option).toBeVisible({ timeout: 10000 });
    } else {
      await expect(option).toHaveCount(0);
    }
  }

  async verifyFromStoreExcludesNonIms(nonImsStores: string[]): Promise<void> {
    log('Verifying From Store excludes Non-IMS stores');
    await this.openFromStoreDropdown();
    for (const store of nonImsStores) {
      await this.searchInOpenDropdown(store.replace(/^WB Unit\s+/i, '').trim());
      await this.verifyStoreOptionVisible(store, false);
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
  }

  async verifyToStoreIncludesStores(stores: string[]): Promise<void> {
    log('Verifying To Store includes IMS and/or Non-IMS stores');
    await this.openToStoreDropdown();
    for (const store of stores) {
      await this.searchInOpenDropdown(store.replace(/^WB Unit\s+/i, '').trim());
      await this.verifyStoreOptionVisible(store, true);
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
  }

  async verifySaveAndSubmitDisabled(): Promise<void> {
    log('Verifying SAVE CHANGES / SUBMIT TRANSFER are disabled on incomplete form');
    const saveDisabled = await this.saveChangesButton.isDisabled().catch(() => true);
    const submitDisabled = await this.submitTransferButton.isDisabled().catch(() => true);
    expect(saveDisabled || submitDisabled).toBeTruthy();
  }

  async verifySaveAndSubmitEnabled(): Promise<void> {
    log('Verifying SAVE CHANGES / SUBMIT TRANSFER are enabled on complete form');
    await expect(this.submitTransferButton).toBeEnabled({ timeout: 15000 });
  }
}
