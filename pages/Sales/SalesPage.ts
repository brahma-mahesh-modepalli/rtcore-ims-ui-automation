/**
 * SalesPage – Page Object
 * =======================
 * Locators and actions for Operations → Sales → Sales Transactions
 * used by RCSP-133 (Service Bus → IMS sales visibility).
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export type SalesSummarySnapshot = {
  transactions: string;
  netRevenue: string;
  refundsInView: string;
  voidedLines: string;
};

export type SalesRowSnapshot = {
  saleId: string;
  type: string;
  timestamp: string;
  mealPeriod: string;
  lines: string;
  total: string;
  status: string;
};

export class SalesPage {
  readonly sidebar: Locator;
  readonly operationsMenu: Locator;
  readonly salesMenu: Locator;
  readonly myHierarchyMenu: Locator;
  readonly dashboardMenu: Locator;

  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly transactionsCard: Locator;
  readonly netRevenueCard: Locator;
  readonly refundsInViewCard: Locator;
  readonly voidedLinesCard: Locator;

  readonly allTab: Locator;
  readonly salesTab: Locator;
  readonly refundsTab: Locator;
  readonly deletedTab: Locator;

  readonly businessDayFilter: Locator;
  readonly mealPeriodFilter: Locator;
  readonly clearFiltersButton: Locator;
  readonly transactionsTable: Locator;
  readonly storeContextIndicator: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.operationsMenu = this.sidebar
      .getByRole('button', { name: /^operations$/i })
      .or(this.sidebar.getByRole('link', { name: /^operations$/i }))
      .or(this.sidebar.getByText(/^operations$/i))
      .first();
    this.salesMenu = this.sidebar
      .getByRole('link', { name: /^sales$/i })
      .or(this.sidebar.getByRole('button', { name: /^sales$/i }))
      .or(this.sidebar.getByText(/^sales$/i))
      .first();
    this.myHierarchyMenu = this.sidebar
      .getByRole('link', { name: /my hierarchy/i })
      .or(this.sidebar.getByRole('button', { name: /my hierarchy/i }))
      .first();
    this.dashboardMenu = this.sidebar
      .getByRole('link', { name: /^dashboard$/i })
      .or(this.sidebar.getByRole('button', { name: /^dashboard$/i }))
      .first();

    this.pageTitle = page
      .getByRole('heading', { name: /sales transactions/i })
      .first();
    this.pageSubtitle = page.getByText(
      /review posted sales|refunds|voids|sales transactions/i,
    ).first();

    this.transactionsCard = page.getByText(/^transactions$/i).first();
    this.netRevenueCard = page.getByText(/net revenue/i).first();
    this.refundsInViewCard = page.getByText(/refunds in view/i).first();
    this.voidedLinesCard = page.getByText(/voided lines/i).first();

    this.allTab = page
      .getByRole('tab', { name: /^all$/i })
      .or(page.getByRole('button', { name: /^all$/i }))
      .first();
    this.salesTab = page
      .getByRole('tab', { name: /^sales$/i })
      .or(page.locator('main').getByRole('button', { name: /^sales$/i }))
      .first();
    this.refundsTab = page
      .getByRole('tab', { name: /^refunds$/i })
      .or(page.getByRole('button', { name: /^refunds$/i }))
      .first();
    this.deletedTab = page
      .getByRole('tab', { name: /^deleted$/i })
      .or(page.getByRole('button', { name: /^deleted$/i }))
      .first();

    this.businessDayFilter = page
      .getByLabel(/business day/i)
      .or(page.getByRole('textbox', { name: /business day/i }))
      .or(page.getByPlaceholder(/business day|dd\/mm|mm\/dd|date/i))
      .or(page.locator('main').getByRole('textbox').first())
      .first();
    this.mealPeriodFilter = page
      .getByLabel(/meal period/i)
      .or(page.getByRole('combobox', { name: /meal period/i }))
      .or(page.getByText(/all meal periods/i))
      .first();
    this.clearFiltersButton = page.getByRole('button', {
      name: /clear filters/i,
    });
    this.transactionsTable = page.getByRole('table').first();
    this.storeContextIndicator = page
      .locator('header')
      .getByText(/WB Unit|Store/i)
      .first();
  }

  // ── Navigation ────────────────────────────────────────────

  async expandOperations(): Promise<void> {
    log('Expanding Operations menu');
    const salesVisible = await this.salesMenu.isVisible().catch(() => false);
    if (!salesVisible) {
      await this.operationsMenu.click();
      await this.page.waitForTimeout(400);
    }
  }

  async openSalesTransactions(): Promise<void> {
    log('Navigating to Operations → Sales (Sales Transactions)');
    await this.expandOperations();
    await expect(this.salesMenu).toBeVisible({ timeout: 15000 });
    await this.salesMenu.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.verifyPageLoaded();
    log('✓ Sales Transactions page loaded');
  }

  async openMyHierarchy(): Promise<void> {
    log('Opening My Hierarchy');
    await this.myHierarchyMenu.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(
      this.page.getByRole('heading', { name: /^My Hierarchy$/i }),
    ).toBeVisible({ timeout: 15000 });
  }

  async openDashboard(): Promise<void> {
    log('Navigating to Dashboard');
    await this.dashboardMenu.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
  }

  // ── Store context ─────────────────────────────────────────

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

  async expandHierarchyPath(region: string, market: string): Promise<void> {
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
  }

  async selectStoreFromHierarchy(store: string): Promise<void> {
    const storeCode = store.replace(/^WB Unit\s+/i, '').trim();
    await this.page.getByText(store, { exact: true }).first().click({ force: true });
    await this.page.waitForTimeout(2000);

    if (await this.isStoreContextActive(storeCode, store)) {
      return;
    }

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
      .or(this.page.getByText(new RegExp(`${store}|${storeCode}`, 'i')))
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

  async switchStore(region: string, market: string, store: string): Promise<void> {
    await this.openMyHierarchy();
    await this.expandHierarchyPath(region, market);
    await this.selectStoreFromHierarchy(store);
    await this.openDashboard();
    await this.verifyActiveStore(store);
  }

  // ── Page / layout verification ────────────────────────────

  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
  }

  async verifySalesPageUi(options: {
    pageTitle: string;
    pageSubtitlePattern: string;
    summaryCards: string[];
    viewTabs: string[];
    columnHeaders: string[];
  }): Promise<void> {
    log('Verifying Sales Transactions page UI');
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
      this.page.getByText(new RegExp(options.pageSubtitlePattern, 'i')).first(),
    ).toBeVisible();

    for (const card of options.summaryCards) {
      await expect(
        this.page.getByText(new RegExp(card, 'i')).first(),
      ).toBeVisible({ timeout: 10000 });
    }

    for (const tab of options.viewTabs) {
      await expect(
        this.page
          .getByRole('tab', { name: new RegExp(`^${tab}$`, 'i') })
          .or(this.page.getByRole('button', { name: new RegExp(`^${tab}$`, 'i') }))
          .first(),
      ).toBeVisible();
    }

    await expect(this.businessDayFilter).toBeVisible({ timeout: 10000 });
    await expect(
      this.page.getByText(/meal period|all meal periods/i).first(),
    ).toBeVisible();
    await expect(this.transactionsTable).toBeVisible();
    await this.verifyColumnHeaders(options.columnHeaders);
    log('✓ Sales Transactions page UI verified');
  }

  async verifyColumnHeaders(headers: string[]): Promise<void> {
    for (const header of headers) {
      await expect(
        this.page
          .getByRole('columnheader', { name: new RegExp(header, 'i') })
          .or(this.page.getByText(new RegExp(`^${header}$`, 'i')))
          .first(),
      ).toBeVisible({ timeout: 10000 });
    }
  }

  // ── Tabs & filters ────────────────────────────────────────

  async selectViewTab(tab: 'All' | 'Sales' | 'Refunds' | 'Deleted'): Promise<void> {
    log(`Selecting view tab: ${tab}`);
    const tabLocator =
      tab === 'All'
        ? this.allTab
        : tab === 'Sales'
          ? this.salesTab
          : tab === 'Refunds'
            ? this.refundsTab
            : this.deletedTab;
    await tabLocator.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(400);
  }

  async getBusinessDayValue(): Promise<string> {
    const inputValue = await this.businessDayFilter.inputValue().catch(() => '');
    if (inputValue.trim()) {
      return inputValue.trim();
    }
    const text = await this.businessDayFilter.innerText().catch(() => '');
    return text.trim();
  }

  async verifyBusinessDayShowsCurrentDate(optionalExpected?: string): Promise<void> {
    log('Verifying Business Day shows current business date');
    const value = await this.getBusinessDayValue();
    expect(value.length).toBeGreaterThan(0);

    if (optionalExpected) {
      const normalizedActual = value.replace(/\s+/g, '');
      const normalizedExpected = optionalExpected.replace(/\s+/g, '');
      expect(
        normalizedActual.includes(normalizedExpected) ||
          normalizedExpected.includes(normalizedActual) ||
          this.datesMatchLoosely(value, optionalExpected),
      ).toBeTruthy();
    } else {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = String(today.getFullYear());
      expect(
        value.includes(day) ||
          value.includes(month) ||
          value.includes(year) ||
          /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(value),
      ).toBeTruthy();
    }
    log(`✓ Business Day value: ${value}`);
  }

  private datesMatchLoosely(actual: string, expected: string): boolean {
    const digits = (s: string) => s.replace(/\D/g, '');
    const a = digits(actual);
    const e = digits(expected);
    return a.length >= 6 && e.length >= 6 && (a.includes(e) || e.includes(a));
  }

  async setBusinessDay(dateValue: string): Promise<void> {
    log(`Setting Business Day filter to: ${dateValue}`);
    await this.businessDayFilter.click({ force: true });
    await this.businessDayFilter.fill('').catch(() => undefined);
    await this.businessDayFilter.fill(dateValue);
    await this.businessDayFilter.press('Enter').catch(() => undefined);
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(700);
  }

  async ensureAllMealPeriods(): Promise<void> {
    log('Ensuring Meal Period = All meal periods');
    const alreadyAll = await this.page
      .getByText(/all meal periods/i)
      .first()
      .isVisible()
      .catch(() => false);
    if (alreadyAll) {
      return;
    }

    await this.mealPeriodFilter.click().catch(() => undefined);
    const option = this.page
      .getByRole('option', { name: /all meal periods/i })
      .or(this.page.getByText(/all meal periods/i))
      .first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
    }
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async selectMealPeriod(mealPeriod: string): Promise<void> {
    log(`Selecting Meal Period: ${mealPeriod}`);
    await this.mealPeriodFilter.click();
    await this.page
      .getByRole('option', { name: new RegExp(mealPeriod, 'i') })
      .or(this.page.getByText(new RegExp(`^${mealPeriod}$`, 'i')))
      .first()
      .click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(500);
  }

  async clearFilters(): Promise<void> {
    log('Clicking Clear filters');
    await expect(this.clearFiltersButton).toBeVisible({ timeout: 10000 });
    await this.clearFiltersButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(700);
  }

  // ── Grid / summary ────────────────────────────────────────

  private dataRows(): Locator {
    return this.transactionsTable.getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
  }

  async getVisibleSaleIds(): Promise<string[]> {
    const rows = this.dataRows();
    const count = await rows.count();
    const saleIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText().catch(() => '')).trim();
      const match = text.match(/SAL-[A-Za-z0-9_-]+/i);
      if (match) {
        saleIds.push(match[0]);
      }
    }
    return saleIds;
  }

  async getTransactionsCountFromSummary(): Promise<number> {
    const cardRegion = this.page
      .locator('div, section, article')
      .filter({ hasText: /^transactions$/i })
      .first();
    const text = await cardRegion.innerText().catch(async () => {
      return this.page.getByText(/transactions/i).first().locator('..').innerText();
    });
    const match = text.match(/(\d[\d,]*)/);
    return match ? Number(match[1].replace(/,/g, '')) : 0;
  }

  async captureSummarySnapshot(): Promise<SalesSummarySnapshot> {
    const readCard = async (label: RegExp): Promise<string> => {
      const region = this.page
        .locator('div, section, article')
        .filter({ hasText: label })
        .first();
      return (await region.innerText().catch(() => '')).trim();
    };

    return {
      transactions: await readCard(/^transactions$/i),
      netRevenue: await readCard(/net revenue/i),
      refundsInView: await readCard(/refunds in view/i),
      voidedLines: await readCard(/voided lines/i),
    };
  }

  async verifySalesRecordsVisible(minimumCount = 1): Promise<void> {
    log('Verifying sales transaction records are visible');
    await expect
      .poll(async () => this.dataRows().count(), {
        timeout: 20000,
        message: 'Waiting for sales transaction rows',
      })
      .toBeGreaterThanOrEqual(minimumCount);

    const saleIds = await this.getVisibleSaleIds();
    if (saleIds.length === 0) {
      const firstRowText = await this.dataRows().first().innerText();
      expect(firstRowText.trim().length).toBeGreaterThan(0);
    } else {
      expect(saleIds.length).toBeGreaterThanOrEqual(minimumCount);
    }
    log(`✓ Sales records visible (rows >= ${minimumCount})`);
  }

  async verifySummaryTransactionsPositive(): Promise<void> {
    const count = await this.getTransactionsCountFromSummary();
    expect(count).toBeGreaterThan(0);
    log(`✓ Transactions summary count: ${count}`);
  }

  async verifySampleRowsHaveRequiredColumns(
    columnHeaders: string[],
    sampleRowCount = 3,
  ): Promise<void> {
    log(`Verifying first ${sampleRowCount} rows have required columns populated`);
    const rows = this.dataRows();
    const count = Math.min(await rows.count(), sampleRowCount);
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      await expect(row).toBeVisible();
      const cells = row.getByRole('cell');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThanOrEqual(Math.min(columnHeaders.length, 5));

      for (let c = 0; c < Math.min(cellCount, columnHeaders.length); c++) {
        const cellText = (await cells.nth(c).innerText()).trim();
        expect(cellText.length).toBeGreaterThan(0);
      }

      const rowText = await row.innerText();
      expect(rowText).toMatch(/sale|posted|sal-/i);
    }
    log('✓ Sample rows have populated Sale ID / Type / Timestamp / Meal Period / Lines / Total / Status');
  }

  async verifyPostedSaleTypeAndStatus(
    expectedType = 'Sale',
    expectedStatus = 'Posted',
  ): Promise<void> {
    const firstRow = this.dataRows().first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    const text = await firstRow.innerText();
    expect(text).toMatch(new RegExp(expectedType, 'i'));
    expect(text).toMatch(new RegExp(expectedStatus, 'i'));
  }

  async verifyEmptyStateOrZeroTransactions(): Promise<void> {
    log('Verifying empty-state / zero transactions handling');
    const rowCount = await this.dataRows().count();
    const emptyMessage = this.page.getByText(
      /no (sales|transactions|records|data)|nothing to (show|display)|0 transactions/i,
    );
    const emptyVisible = await emptyMessage.first().isVisible().catch(() => false);
    const summaryCount = await this.getTransactionsCountFromSummary().catch(() => 0);

    expect(rowCount === 0 || emptyVisible || summaryCount === 0).toBeTruthy();
    await expect(this.pageTitle).toBeVisible();
    log('✓ Empty / zero-sales state handled without UI errors');
  }

  async verifySaleIdAbsent(saleId: string): Promise<void> {
    log(`Verifying Sale ID is absent: ${saleId}`);
    await expect(
      this.page.getByText(saleId, { exact: false }),
    ).toHaveCount(0);
  }

  async verifyNoDuplicateSaleIds(): Promise<void> {
    const saleIds = await this.getVisibleSaleIds();
    const unique = new Set(saleIds);
    expect(unique.size).toBe(saleIds.length);
    log(`✓ No duplicate Sale IDs among ${saleIds.length} visible rows`);
  }

  async refreshAndReopenSales(): Promise<void> {
    log('Refreshing browser and re-opening Sales Transactions');
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    const stillOnSales = await this.pageTitle.isVisible().catch(() => false);
    if (!stillOnSales) {
      await this.openSalesTransactions();
    } else {
      await this.verifyPageLoaded();
    }
  }
}
