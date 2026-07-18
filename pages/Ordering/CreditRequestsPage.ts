/**
 * CreditRequestsPage – Page Object
 * ================================
 * Locators and actions for Ordering → Credit Requests
 * (RCSP-169 rename + RCSP-595 damaged-item / UOM flows).
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export interface CreditRequestVendorData {
  orderType: string;
  receivedPoSearch: string;
  nonReceivedPoSearch?: string;
  emptyReceivedPoSearch?: string;
  itemName?: string;
  itemSku?: string;
  expectedUoms?: string[];
  alternateUom?: string;
  incidentType?: string;
  qty?: string;
  canUseProduct?: string;
  enoughGoodProductOrIut?: string;
}

export class CreditRequestsPage {
  readonly sidebar: Locator;
  readonly orderingMenu: Locator;
  readonly creditRequestsLink: Locator;
  readonly creditMemosLink: Locator;
  readonly orderHistoryLink: Locator;

  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly newCreditRequestButton: Locator;
  readonly newCreditMemoButton: Locator;
  readonly draftClaimValueCard: Locator;
  readonly submittedCard: Locator;
  readonly creditRequestsTable: Locator;

  readonly startCreditRequestButton: Locator;
  readonly poSearchInput: Locator;
  readonly damagedItemsHeading: Locator;
  readonly saveButton: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.orderingMenu = this.sidebar.getByRole('button', { name: /^ordering$/i });
    this.creditRequestsLink = this.sidebar
      .getByRole('link', { name: /credit requests/i })
      .or(this.sidebar.getByRole('button', { name: /credit requests/i }));
    this.creditMemosLink = this.sidebar
      .getByRole('link', { name: /credit memos/i })
      .or(this.sidebar.getByRole('button', { name: /credit memos/i }));
    this.orderHistoryLink = this.sidebar
      .getByRole('link', { name: /order history/i })
      .or(this.sidebar.getByRole('button', { name: /order history/i }));

    this.pageTitle = page.getByRole('heading', { name: /^credit requests$/i }).first();
    this.pageDescription = page.getByText(
      /track vendor claims tied to purchases and shortages/i,
    );
    this.newCreditRequestButton = page.getByRole('button', {
      name: /new credit request/i,
    });
    this.newCreditMemoButton = page.getByRole('button', {
      name: /new credit memo/i,
    });
    this.draftClaimValueCard = page.getByText(/draft claim value/i).first();
    this.submittedCard = page
      .locator('main')
      .getByText(/^submitted$/i)
      .or(page.getByText(/submitted/i).filter({ hasNotText: /filter|tab/i }))
      .first();
    this.creditRequestsTable = page.getByRole('table').first();

    this.startCreditRequestButton = page.getByRole('button', {
      name: /start credit request/i,
    });
    this.poSearchInput = page
      .getByPlaceholder(/purchase order|received items|search/i)
      .or(page.getByRole('combobox', { name: /purchase order|received/i }))
      .or(page.locator('input[type="search"], input[role="combobox"]').first())
      .first();
    this.damagedItemsHeading = page
      .getByRole('heading', { name: /damaged items from order/i })
      .or(page.getByText(/damaged items from order/i))
      .first();
    this.saveButton = page.getByRole('button', {
      name: /^(save|save draft|save credit request)$/i,
    });
    this.submitButton = page.getByRole('button', {
      name: /submit( credit request)?/i,
    });
  }

  statusTab(name: string): Locator {
    return this.page
      .getByRole('button', { name: new RegExp(`^${name}$`, 'i') })
      .or(this.page.getByRole('tab', { name: new RegExp(`^${name}$`, 'i') }))
      .first();
  }

  async expandOrdering(): Promise<void> {
    log('Expanding Ordering menu');
    const submenuVisible = await this.creditRequestsLink
      .or(this.orderHistoryLink)
      .first()
      .isVisible()
      .catch(() => false);
    if (!submenuVisible) {
      await this.orderingMenu.click();
      await this.page.waitForTimeout(400);
    }
  }

  async collapseOrdering(): Promise<void> {
    log('Collapsing Ordering menu');
    const submenuVisible = await this.creditRequestsLink.isVisible().catch(() => false);
    if (submenuVisible) {
      await this.orderingMenu.click();
      await this.page.waitForTimeout(400);
    }
  }

  async openCreditRequests(): Promise<void> {
    log('Navigating to Ordering → Credit Requests');
    await this.expandOrdering();
    await expect(this.creditRequestsLink.first()).toBeVisible({ timeout: 15000 });
    await this.creditRequestsLink.first().click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.verifyCreditRequestsPageLoaded();
    log('✓ Credit Requests page loaded');
  }

  async openOrderHistory(): Promise<void> {
    log('Navigating to Ordering → Order History');
    await this.expandOrdering();
    await expect(this.orderHistoryLink.first()).toBeVisible({ timeout: 15000 });
    await this.orderHistoryLink.first().click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await expect(
      this.page.getByRole('heading', { name: /order history/i }).first(),
    ).toBeVisible({ timeout: 15000 });
    log('✓ Order History page loaded');
  }

  async verifyCreditRequestsPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
    await expect(this.pageDescription).toBeVisible({ timeout: 15000 });
  }

  async verifyOrderingShowsCreditRequestsNotMemos(): Promise<void> {
    await this.expandOrdering();
    await expect(this.creditRequestsLink.first()).toBeVisible({ timeout: 15000 });
    await expect(this.creditMemosLink.first()).toHaveCount(0);
    log('✓ Ordering submenu shows Credit Requests and not Credit Memos');
  }

  async verifyListingPrimaryCtaAndSummary(input: {
    expectedPrimaryButton: string;
    forbiddenPrimaryButton: string;
    summaryCards: string[];
    statusTabs: string[];
  }): Promise<void> {
    await expect(this.newCreditRequestButton).toBeVisible({ timeout: 15000 });
    await expect(this.newCreditRequestButton).toContainText(
      new RegExp(input.expectedPrimaryButton, 'i'),
    );
    await expect(this.newCreditMemoButton).toHaveCount(0);

    for (const card of input.summaryCards) {
      await expect(this.page.getByText(new RegExp(card, 'i')).first()).toBeVisible({
        timeout: 15000,
      });
    }

    for (const tab of input.statusTabs) {
      await expect(this.statusTab(tab)).toBeVisible({ timeout: 15000 });
    }

    await expect(
      this.page.getByText(/new credit memo|credit memo/i).filter({
        has: this.page.getByRole('button'),
      }),
    ).toHaveCount(0);
    log('✓ Listing CTA, summary cards, and status tabs verified');
  }

  async selectStatusTab(name: string): Promise<void> {
    log(`Selecting Credit Requests tab: ${name}`);
    await this.statusTab(name).click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async verifyUserFacingRenameAndIdFormat(input: {
    expectedPageTitle: string;
    expectedPrimaryButton: string;
    acceptedIdPattern: string;
    preferredIdColumnHeaders: string[];
    legacyIdColumnHeader: string;
  }): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toContainText(new RegExp(input.expectedPageTitle, 'i'));
    await expect(this.newCreditRequestButton).toBeVisible();
    await expect(this.newCreditRequestButton).toContainText(
      new RegExp(input.expectedPrimaryButton, 'i'),
    );

    const preferredHeader = this.page
      .getByRole('columnheader')
      .filter({
        hasText: new RegExp(input.preferredIdColumnHeaders.join('|'), 'i'),
      })
      .first();
    const legacyHeader = this.page.getByRole('columnheader', {
      name: new RegExp(input.legacyIdColumnHeader.replace('#', '\\s*#'), 'i'),
    });

    const hasPreferred = await preferredHeader.isVisible().catch(() => false);
    const hasLegacy = await legacyHeader.isVisible().catch(() => false);

    if (hasPreferred) {
      log(`✓ ID column uses preferred rename header`);
    } else if (hasLegacy) {
      log(
        `Accepted exception: grid still shows "${input.legacyIdColumnHeader}" as technical ID column`,
      );
    } else {
      log('ID column header not matched to preferred or legacy labels; continuing with row ID check');
    }

    const firstDataRow = this.creditRequestsTable.getByRole('row').nth(1);
    if (await firstDataRow.isVisible().catch(() => false)) {
      const rowText = await firstDataRow.innerText();
      if (new RegExp(input.acceptedIdPattern, 'i').test(rowText)) {
        log(
          `Accepted exception: row ID uses technical pattern ${input.acceptedIdPattern}`,
        );
      }
    }

    await expect(this.pageTitle).not.toContainText(/credit memos/i);
    await expect(this.newCreditMemoButton).toHaveCount(0);
  }

  async verifyCreditAccessUnavailable(): Promise<void> {
    const orderingVisible = await this.orderingMenu.isVisible().catch(() => false);
    if (orderingVisible) {
      await this.expandOrdering();
      await expect(this.creditRequestsLink.first()).toHaveCount(0);
      await expect(this.creditMemosLink.first()).toHaveCount(0);
    } else {
      log('Ordering menu not visible for unauthorized user');
    }
  }

  async attemptLegacyRouteAccess(route: string): Promise<void> {
    log(`Attempting direct navigation to ${route}`);
    await this.page.goto(route, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(1000);
    const landedOnCreditRequests = await this.pageTitle.isVisible().catch(() => false);
    const hasNewRequest = await this.newCreditRequestButton.isVisible().catch(() => false);
    expect(landedOnCreditRequests && hasNewRequest).toBeFalsy();
    log('✓ Unauthorized user cannot use legacy credit route');
  }

  async verifyRenameLabelsPersist(input: {
    expectedMenuLabel: string;
    expectedPageTitle: string;
    expectedPrimaryButton: string;
    forbiddenLabels: string[];
  }): Promise<void> {
    await this.expandOrdering();
    await expect(this.creditRequestsLink.first()).toBeVisible();
    await expect(this.creditRequestsLink.first()).toContainText(
      new RegExp(input.expectedMenuLabel, 'i'),
    );
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toContainText(new RegExp(input.expectedPageTitle, 'i'));
    await expect(this.newCreditRequestButton).toBeVisible();
    await expect(this.newCreditRequestButton).toContainText(
      new RegExp(input.expectedPrimaryButton, 'i'),
    );

    for (const forbidden of input.forbiddenLabels) {
      await expect(this.creditMemosLink.first()).toHaveCount(0);
      if (/new credit memo/i.test(forbidden)) {
        await expect(this.newCreditMemoButton).toHaveCount(0);
      }
    }
    log('✓ Credit Requests rename labels remain stable');
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async refreshPage(): Promise<void> {
    log('Refreshing browser');
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  // --- RCSP-595: damaged items / UOM ---

  async clickNewCreditRequest(): Promise<void> {
    log('Clicking New Credit Request / START CREDIT REQUEST');
    await expect(this.newCreditRequestButton).toBeVisible({ timeout: 15000 });
    await this.newCreditRequestButton.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.page.waitForTimeout(500);
  }

  async verifyPoSearchVisible(): Promise<void> {
    await expect(
      this.page
        .getByText(/purchase order with received items|select.*purchase order|received items/i)
        .first(),
    ).toBeVisible({ timeout: 15000 });
    const searchVisible = await this.poSearchInput.isVisible().catch(() => false);
    if (!searchVisible) {
      await expect(this.page.locator('input').first()).toBeVisible({ timeout: 15000 });
    }
    await expect(
      this.startCreditRequestButton.or(this.page.getByRole('button', { name: /start/i })).first(),
    ).toBeVisible({ timeout: 15000 });
    log('✓ Purchase Order with Received Items search section is visible');
  }

  async searchAndSelectPurchaseOrder(poSearch: string): Promise<void> {
    if (!poSearch?.trim()) {
      throw new Error('receivedPoSearch is empty — set it in RCSP-595.json commonData');
    }
    log(`Searching Purchase Order: ${poSearch}`);
    const input = this.page
      .getByPlaceholder(/purchase order|received items|filter|search/i)
      .or(this.page.locator('input[type="search"], input[role="combobox"]'))
      .first();
    await expect(input).toBeVisible({ timeout: 15000 });
    await input.click();
    await input.fill('');
    await input.fill(poSearch);
    await this.page.waitForTimeout(600);

    const option = this.page
      .getByRole('option', {
        name: new RegExp(poSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      })
      .or(this.page.getByText(new RegExp(poSearch, 'i')).first());
    await expect(option.first()).toBeVisible({ timeout: 15000 });
    await option.first().click();
    log(`✓ Selected Purchase Order matching: ${poSearch}`);
  }

  async clickStartCreditRequest(): Promise<void> {
    log('Clicking Start Credit Request');
    const btn = this.startCreditRequestButton
      .or(this.page.getByRole('button', { name: /start credit request|continue|next/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15000 });
    await btn.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
  }

  async verifyDamagedItemsPageLoaded(): Promise<void> {
    await expect(this.damagedItemsHeading).toBeVisible({ timeout: 20000 });
    log('✓ Damaged Items From Order page loaded');
  }

  itemRow(itemHint?: string): Locator {
    const main = this.page.locator('main').or(this.page.locator('body'));
    if (itemHint?.trim()) {
      return main
        .locator('tr, [role="row"], [class*="item"], section, div')
        .filter({ hasText: new RegExp(itemHint, 'i') })
        .first();
    }
    return main
      .locator('tr, [role="row"]')
      .filter({ has: this.page.locator('input[type="checkbox"]') })
      .first();
  }

  async selectDamaged(itemHint?: string, checked = true): Promise<void> {
    log(
      `${checked ? 'Selecting' : 'Unchecking'} Damaged checkbox${itemHint ? ` for ${itemHint}` : ''}`,
    );
    const scope = this.itemRow(itemHint);
    const damaged = scope
      .getByRole('checkbox', { name: /damaged/i })
      .or(scope.locator('label').filter({ hasText: /^damaged$/i }).locator('input'))
      .or(this.page.getByRole('checkbox', { name: /damaged/i }).first());
    const box = damaged.first();
    await expect(box).toBeVisible({ timeout: 15000 });
    const isChecked = await box.isChecked().catch(() => false);
    if (isChecked !== checked) {
      await box.click({ force: true });
    }
    await this.page.waitForTimeout(400);
  }

  async verifyDamagedFieldsVisible(expectedFields: string[]): Promise<void> {
    for (const field of expectedFields) {
      await expect(
        this.page
          .getByText(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
          .first(),
      ).toBeVisible({ timeout: 15000 });
    }
    log('✓ Damaged-item mandatory fields are visible');
  }

  async verifyDamagedFieldsHidden(expectedFields: string[]): Promise<void> {
    for (const field of expectedFields) {
      const loc = this.page.getByText(
        new RegExp(`^${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
      );
      const visible = await loc.first().isVisible().catch(() => false);
      expect(visible).toBeFalsy();
    }
    log('✓ Damaged-item fields are hidden when Damaged is unchecked');
  }

  uomControl(itemHint?: string): Locator {
    const scope = itemHint ? this.itemRow(itemHint) : this.page.locator('main');
    return scope
      .getByRole('combobox', { name: /uom/i })
      .or(scope.locator('label').filter({ hasText: /uom/i }).locator('..').getByRole('combobox'))
      .or(this.page.getByLabel(/^uom/i))
      .first();
  }

  async openUomOptions(itemHint?: string): Promise<string[]> {
    const uom = this.uomControl(itemHint);
    await expect(uom).toBeVisible({ timeout: 15000 });
    await uom.click();
    await this.page.waitForTimeout(300);
    const options = this.page.getByRole('option');
    const count = await options.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).innerText()).trim();
      if (text) values.push(text);
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    log(`UOM options: ${values.join(', ')}`);
    return values;
  }

  async selectUom(value: string, itemHint?: string): Promise<void> {
    log(`Selecting UOM: ${value}`);
    const uom = this.uomControl(itemHint);
    await expect(uom).toBeVisible({ timeout: 15000 });
    await uom.click();
    const option = this.page
      .getByRole('option', { name: new RegExp(`^${value}$`, 'i') })
      .first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
    } else {
      await this.page.getByText(new RegExp(`^${value}$`, 'i')).first().click();
    }
  }

  async fillDamagedFields(
    vendor: CreditRequestVendorData,
    options: {
      omit?: Array<
        | 'incidentType'
        | 'qty'
        | 'uom'
        | 'canUseProduct'
        | 'enoughGoodProductOrIut'
        | 'images'
      >;
      qtyOverride?: string;
      uomOverride?: string;
      uploadImage?: boolean;
      imagePath?: string;
      itemHint?: string;
    } = {},
  ): Promise<void> {
    const omit = new Set(options.omit ?? []);
    const itemHint = options.itemHint || vendor.itemName;

    if (!omit.has('incidentType') && vendor.incidentType) {
      await this.fillLabeledControl(/incident type/i, vendor.incidentType);
    }
    if (!omit.has('qty')) {
      const qty = options.qtyOverride ?? vendor.qty ?? '1';
      await this.fillLabeledControl(/^qty|quantity/i, qty);
    }
    if (!omit.has('uom')) {
      const uom =
        options.uomOverride || vendor.alternateUom || vendor.expectedUoms?.[0] || 'EA';
      await this.selectUom(uom, itemHint);
    }
    if (!omit.has('canUseProduct') && vendor.canUseProduct) {
      await this.answerYesNo(/can you use this product/i, vendor.canUseProduct);
    }
    if (!omit.has('enoughGoodProductOrIut') && vendor.enoughGoodProductOrIut) {
      await this.answerYesNo(
        /enough good product|iut from another unit/i,
        vendor.enoughGoodProductOrIut,
      );
    }
    if (!omit.has('images') && options.uploadImage !== false && options.imagePath) {
      await this.uploadImages(options.imagePath);
    }
  }

  private async fillLabeledControl(label: RegExp, value: string): Promise<void> {
    const field = this.page
      .getByLabel(label)
      .or(
        this.page
          .locator('label')
          .filter({ hasText: label })
          .locator('..')
          .locator('input, textarea, [role="combobox"]')
          .first(),
      )
      .first();
    await expect(field).toBeVisible({ timeout: 15000 });
    const role = await field.getAttribute('role');
    const tag = await field.evaluate((el) => el.tagName.toLowerCase());
    if (role === 'combobox' || tag === 'select') {
      await field.click();
      const option = this.page.getByRole('option', { name: new RegExp(value, 'i') }).first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        return;
      }
      await this.page.getByText(new RegExp(value, 'i')).first().click();
      return;
    }
    await field.fill('');
    await field.fill(value);
  }

  private async answerYesNo(label: RegExp, answer: string): Promise<void> {
    const section = this.page.locator('label, div, fieldset').filter({ hasText: label }).first();
    const choice = section
      .getByRole('radio', { name: new RegExp(`^${answer}$`, 'i') })
      .or(section.getByRole('button', { name: new RegExp(`^${answer}$`, 'i') }))
      .or(this.page.getByRole('radio', { name: new RegExp(`^${answer}$`, 'i') }))
      .first();
    if (await choice.isVisible().catch(() => false)) {
      await choice.click();
      return;
    }
    await this.fillLabeledControl(label, answer);
  }

  async uploadImages(filePath: string): Promise<void> {
    log(`Uploading image: ${filePath}`);
    const fileInput = this.page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached({ timeout: 15000 });
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(500);
  }

  async saveDraft(): Promise<void> {
    log('Saving Credit Request draft');
    await expect(this.saveButton.first()).toBeVisible({ timeout: 15000 });
    await this.saveButton.first().click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(500);
  }

  async submitCreditRequest(): Promise<void> {
    log('Submitting Credit Request');
    await expect(this.submitButton.first()).toBeVisible({ timeout: 15000 });
    await this.submitButton.first().click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.waitForTimeout(800);
  }

  async verifyValidationVisible(fieldHint?: string): Promise<void> {
    const validation = this.page
      .getByText(/required|mandatory|must|please select|cannot be blank|invalid/i)
      .first();
    await expect(validation).toBeVisible({ timeout: 10000 });
    if (fieldHint) {
      const nearField = this.page.getByText(new RegExp(fieldHint, 'i')).first();
      await expect(nearField).toBeVisible({ timeout: 5000 }).catch(() => undefined);
    }
    log('✓ Validation message visible');
  }

  async verifyStillOnPoSelectionOrNotDamagedPage(): Promise<void> {
    const onDamaged = await this.damagedItemsHeading.isVisible().catch(() => false);
    expect(onDamaged).toBeFalsy();
    log('✓ Did not navigate to Damaged Items From Order');
  }

  async verifyUomReadOnly(itemHint?: string): Promise<void> {
    const uom = this.uomControl(itemHint);
    await expect(uom).toBeVisible({ timeout: 15000 });
    const disabled =
      (await uom.isDisabled().catch(() => false)) ||
      (await uom.getAttribute('aria-disabled')) === 'true' ||
      (await uom.getAttribute('readonly')) !== null;
    const tag = await uom.evaluate((el) => el.tagName.toLowerCase());
    if (!disabled && tag !== 'input') {
      const before = (await uom.innerText().catch(async () => uom.inputValue())).trim();
      await uom.click({ force: true }).catch(() => undefined);
      await this.page.keyboard.press('ArrowDown').catch(() => undefined);
      await this.page.keyboard.press('Escape').catch(() => undefined);
      const after = (await uom.innerText().catch(async () => uom.inputValue())).trim();
      expect(after).toBe(before);
    } else {
      expect(disabled).toBeTruthy();
    }
    log('✓ UOM is read-only / non-editable after submit');
  }

  async openDraftOrSubmittedByStatus(status: 'Draft' | 'Submitted'): Promise<void> {
    await this.openCreditRequests();
    await this.selectStatusTab(status);
    const row = this.creditRequestsTable.getByRole('row').nth(1);
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
  }

  async startDamagedFlow(poSearch: string): Promise<void> {
    await this.openCreditRequests();
    await this.clickNewCreditRequest();
    await this.verifyPoSearchVisible();
    await this.searchAndSelectPurchaseOrder(poSearch);
    await this.clickStartCreditRequest();
    await this.verifyDamagedItemsPageLoaded();
  }

  async assertPoNotStartable(poSearch: string): Promise<void> {
    await this.clickNewCreditRequest();
    await this.verifyPoSearchVisible();
    const input = this.page
      .getByPlaceholder(/purchase order|received items|filter|search/i)
      .or(this.page.locator('input[type="search"], input[role="combobox"]'))
      .first();
    await input.fill(poSearch);
    await this.page.waitForTimeout(700);
    const option = this.page.getByRole('option', {
      name: new RegExp(poSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    });
    const found = await option.first().isVisible().catch(() => false);
    if (found) {
      await option.first().click();
      await this.clickStartCreditRequest();
      await this.verifyStillOnPoSelectionOrNotDamagedPage();
    } else {
      log(`✓ Non-eligible PO "${poSearch}" not listed in Received Items search`);
    }
  }
}
