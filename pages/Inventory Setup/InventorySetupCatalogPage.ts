/**
 * InventorySetupCatalogPage – Page Object
 * =======================================
 * Shared navigation and table assertions for Menu Items, Recipes, and Master Items (RCSP-110).
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';

export type Catalog = 'menuItems' | 'recipes' | 'masterItems';

type CatalogDefinition = {
  path: string;
  linkPattern: RegExp;
  headingPattern: RegExp;
  headers: RegExp[];
};

const CATALOGS: Record<Catalog, CatalogDefinition> = {
  menuItems: {
    path: '/inventory/menu-items',
    linkPattern: /menu items?/i,
    headingPattern: /menu items?/i,
    headers: [/^name$/i, /^sku$/i, /^category$/i, /^price$/i, /^status$/i],
  },
  recipes: {
    path: '/recipes',
    linkPattern: /^recipe$/i,
    headingPattern: /recipes?/i,
    headers: [/recipe item/i, /^sku$/i, /version/i, /yield/i, /ingredients/i, /^status$/i],
  },
  masterItems: {
    path: '/masters',
    linkPattern: /master item/i,
    headingPattern: /master items?/i,
    headers: [/master item/i, /version/i, /children/i, /^status$/i],
  },
};

export class InventorySetupCatalogPage {
  readonly sidebar: Locator;
  readonly inventorySetupSection: Locator;
  readonly pageTitle: Locator;
  readonly newMenuItemButton: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.inventorySetupSection = this.sidebar
      .getByRole('button', { name: /inventory setup/i })
      .or(this.sidebar.getByText(/inventory setup/i))
      .first();
    this.pageTitle = page.getByRole('heading').first();
    this.newMenuItemButton = page.getByRole('button', { name: /new menu item/i }).first();
  }

  private async expandInventorySetup(): Promise<void> {
    const menuLink = this.sidebar.getByRole('link', { name: /menu items?/i }).first();
    if (!(await menuLink.isVisible().catch(() => false))) {
      await this.inventorySetupSection.click().catch(() => undefined);
      await this.page.waitForTimeout(400);
    }
  }

  async navigate(catalog: Catalog): Promise<void> {
    const definition = CATALOGS[catalog];
    log(`Navigating to ${definition.path}`);
    await this.expandInventorySetup();

    const link = this.page
      .locator(`a[href="${definition.path}"]`)
      .or(this.sidebar.getByRole('link', { name: definition.linkPattern }))
      .first();

    if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
      await link.click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    } else {
      await this.page.goto(`${CONFIG.baseURL}${definition.path}`);
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    }

    await expect(this.page.getByRole('heading', { name: definition.headingPattern }).first())
      .toBeVisible({ timeout: 15000 });
    log(`✓ ${catalog} page loaded`);
  }

  async verifyPage(catalog: Catalog): Promise<void> {
    const definition = CATALOGS[catalog];
    await expect(this.page.getByRole('heading', { name: definition.headingPattern }).first())
      .toBeVisible({ timeout: 15000 });
    await this.verifyHeaders(catalog);
  }

  private dataRows(): Locator {
    return this.page.getByRole('row').filter({
      hasNot: this.page.getByRole('columnheader'),
    });
  }

  private async getHeaders(): Promise<string[]> {
    return (await this.page.getByRole('columnheader').allTextContents())
      .map((value) => value.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  async verifyHeaders(catalog: Catalog): Promise<void> {
    const definition = CATALOGS[catalog];
    const headers = await this.getHeaders();
    expect(headers.length, `${catalog} should expose table headers`).toBeGreaterThan(0);
    for (const expected of definition.headers) {
      expect(
        headers.some((actual) => expected.test(actual)),
        `${catalog} should contain a header matching ${expected}; actual: ${headers.join(', ')}`,
      ).toBeTruthy();
    }
  }

  async verifyHasDataRow(): Promise<void> {
    await expect(this.dataRows().first()).toBeVisible({ timeout: 15000 });
  }

  async getVisibleRows(): Promise<string[][]> {
    const rows = this.dataRows();
    const count = await rows.count();
    const values: string[][] = [];
    for (let index = 0; index < count; index++) {
      const cells = await rows.nth(index).getByRole('cell').allTextContents();
      values.push(cells.map((value) => value.replace(/\s+/g, ' ').trim()));
    }
    return values;
  }

  async verifyRowsHaveValues(): Promise<void> {
    const rows = await this.getVisibleRows();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows.slice(0, 10)) {
      expect(row.some((value) => value.length > 0)).toBeTruthy();
    }
  }

  async selectFirstRecipe(): Promise<void> {
    await this.verifyHasDataRow();
    await this.dataRows().first().click();
    await this.page.waitForTimeout(500);
  }

  async verifyRecipeIngredientsDisplayed(): Promise<void> {
    await expect(
      this.page.getByText(/ingredients?|mapped ingredients?|recipe details/i).first(),
    ).toBeVisible({ timeout: 10000 });
  }

  async verifyMasterChildrenDisplayed(): Promise<void> {
    const rows = await this.getVisibleRows();
    expect(rows.length).toBeGreaterThan(0);
    const childrenColumn = (await this.getHeaders()).findIndex((header) => /children/i.test(header));
    expect(childrenColumn).toBeGreaterThanOrEqual(0);
    expect(rows.some((row) => row[childrenColumn]?.length > 0)).toBeTruthy();
  }
}
