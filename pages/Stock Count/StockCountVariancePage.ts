/**
 * StockCountVariancePage – shared Item Count variance indicator actions (RCSP-211).
 * Works on Daily Shift Count / Weekly Count / Monthly Count detail screens.
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export type VarianceColor = 'green' | 'red' | 'yellow';

export function calcLowerVarianceBound(
  expected: number,
  variancePercent: number,
): number {
  return expected - (expected * variancePercent) / 100;
}

/** Quantity within threshold: lowerBound <= qty < expected (Excel TC green rule). */
export function quantityForGreen(
  expected: number,
  variancePercent: number,
): string {
  if (expected <= 0) return '0';
  const lower = calcLowerVarianceBound(expected, variancePercent);
  let qty = Math.floor((lower + expected) / 2);
  if (qty >= expected) qty = expected - 1;
  if (qty < lower) qty = Math.ceil(lower);
  if (qty < 0) qty = 0;
  if (qty >= expected && expected > 0) qty = Math.max(0, expected - 1);
  return String(qty);
}

/** Quantity outside threshold: below lower bound (or above expected). */
export function quantityForRed(
  expected: number,
  variancePercent: number,
): string {
  const lower = calcLowerVarianceBound(expected, variancePercent);
  const below = Math.floor(lower) - 1;
  if (below >= 0) return String(below);
  return String(Math.floor(expected) + Math.max(1, Math.ceil(expected * 0.5)));
}

export class StockCountVariancePage {
  readonly saveCountsButton: Locator;
  readonly lockCountButton: Locator;
  readonly addItemButton: Locator;
  readonly itemTable: Locator;

  constructor(private readonly page: Page) {
    this.saveCountsButton = page.getByRole('button', { name: /save counts/i });
    this.lockCountButton = page.getByRole('button', { name: /lock count/i });
    this.addItemButton = page.getByRole('button', { name: /^add item$/i });
    this.itemTable = page.getByRole('table').first();
  }

  private escape(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  itemRows(itemName: string): Locator {
    return this.page.getByRole('row').filter({
      hasText: new RegExp(this.escape(itemName), 'i'),
    });
  }

  itemRow(itemName: string, locationName?: string): Locator {
    let rows = this.itemRows(itemName);
    if (locationName) {
      rows = rows.filter({
        hasText: new RegExp(this.escape(locationName), 'i'),
      });
    }
    return rows.first();
  }

  async openAddItemDialog(): Promise<void> {
    await expect(this.addItemButton.first()).toBeVisible({ timeout: 15000 });
    await this.addItemButton.first().click();
    await expect(
      this.page.getByPlaceholder(/search by name or plu/i).first(),
    ).toBeVisible({ timeout: 15000 });
  }

  async addItemWithLocation(
    searchTerm: string,
    preferredItem: string,
    locationName: string,
  ): Promise<void> {
    log(`Adding "${preferredItem}" at location "${locationName}"`);
    await this.openAddItemDialog();

    const search = this.page.getByPlaceholder(/search by name or plu/i).first();
    await search.fill(searchTerm);
    await this.page.waitForTimeout(700);

    const option = this.page
      .getByRole('option')
      .filter({ hasText: new RegExp(this.escape(preferredItem), 'i') })
      .first()
      .or(
        this.page
          .locator('[cmdk-item], [role="option"], li')
          .filter({ hasText: new RegExp(this.escape(preferredItem), 'i') })
          .first(),
      );
    await expect(option).toBeVisible({ timeout: 15000 });
    await option.click();

    const locationsTrigger = this.page
      .getByRole('button', { name: /select locations|locations/i })
      .or(this.page.getByLabel(/location/i))
      .first();
    if (await locationsTrigger.isVisible().catch(() => false)) {
      await locationsTrigger.click();
      const locOption = this.page
        .getByRole('option', { name: new RegExp(`^${this.escape(locationName)}$`, 'i') })
        .or(
          this.page.getByRole('button', {
            name: new RegExp(`^${this.escape(locationName)}$`, 'i'),
          }),
        )
        .or(this.page.getByText(new RegExp(`^${this.escape(locationName)}$`, 'i')))
        .first();
      await expect(locOption).toBeVisible({ timeout: 10000 });
      await locOption.click();
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }

    const confirm = this.page.getByRole('button', { name: /^add item$/i }).last();
    await expect(confirm).toBeEnabled({ timeout: 10000 });
    await confirm.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(this.itemRow(preferredItem, locationName)).toBeVisible({
      timeout: 20000,
    });
    log(`✓ Item "${preferredItem}" added for "${locationName}"`);
  }

  async readExpectedQuantity(
    itemName: string,
    locationName?: string,
  ): Promise<number> {
    const row = this.itemRow(itemName, locationName);
    await expect(row).toBeVisible({ timeout: 15000 });
    const cells = row.getByRole('cell');
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).trim();
      // Prefer numeric cell that is not the counted spinbutton value
      const match = text.match(/^(-?\d+(?:\.\d+)?)$/);
      if (match) {
        const value = Number(match[1]);
        if (Number.isFinite(value)) {
          log(`✓ Expected Quantity captured: ${value}`);
          return value;
        }
      }
    }

    const rowText = await row.innerText();
    const nums = [...rowText.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map((m) =>
      Number(m[1]),
    );
    if (nums.length > 0) {
      log(`✓ Expected Quantity inferred: ${nums[0]}`);
      return nums[0];
    }
    throw new Error(`Could not read Expected Quantity for "${itemName}"`);
  }

  async enterEaQuantity(
    itemName: string,
    quantity: string,
    locationName?: string,
  ): Promise<void> {
    const row = this.itemRow(itemName, locationName);
    await expect(row).toBeVisible({ timeout: 15000 });

    const spinbuttons = row.getByRole('spinbutton');
    const spinCount = await spinbuttons.count();
    let input: Locator;
    if (spinCount >= 3) {
      input = spinbuttons.nth(2); // cs, pk, ea
    } else if (spinCount >= 1) {
      input = spinbuttons.last();
    } else {
      input = row
        .locator('input[type="number"], input[name*="ea" i], input')
        .last();
    }

    await expect(input).toBeVisible({ timeout: 10000 });
    await input.click();
    await input.fill('');
    await input.fill(quantity);
    await input.blur().catch(() => undefined);
    await this.page.waitForTimeout(400);
    log(`✓ Entered EA counted quantity "${quantity}" for "${itemName}"`);
  }

  private colorPatterns(color: VarianceColor): RegExp {
    switch (color) {
      case 'green':
        return /green|within|in.?range|acceptable|ok\b|pass/i;
      case 'red':
        return /red|exceed|flagged|out.?of.?range|variance.?exceeded|fail/i;
      case 'yellow':
        return /yellow|partial|incomplete|pending/i;
    }
  }

  private async sampleIndicatorColor(
    row: Locator,
  ): Promise<{ rgb?: string; className?: string; text: string }> {
    const text = (await row.innerText()).trim();
    const indicator = row
      .locator(
        '[class*="variance" i], [class*="status" i], [data-status], [data-variance], svg, span, div',
      )
      .first();

    if (!(await indicator.isVisible().catch(() => false))) {
      return { text };
    }

    const meta = await indicator
      .evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          rgb: style.backgroundColor || style.color,
          className: el.className?.toString?.() ?? '',
        };
      })
      .catch(() => ({ rgb: '', className: '' }));

    return { ...meta, text };
  }

  private rgbLooksLike(
    rgb: string | undefined,
    color: VarianceColor,
  ): boolean {
    if (!rgb) return false;
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return false;
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    if (color === 'green') return g > r + 20 && g > b + 20;
    if (color === 'red') return r > g + 20 && r > b + 20;
    // yellow: high r+g, low b
    return r > 150 && g > 120 && b < 120;
  }

  async verifyVarianceColor(
    itemName: string,
    color: VarianceColor,
    locationName?: string,
  ): Promise<void> {
    const row = this.itemRow(itemName, locationName);
    await expect(row).toBeVisible({ timeout: 15000 });

    const pattern = this.colorPatterns(color);
    const statusMatch = row.getByText(pattern).first();
    if (await statusMatch.isVisible().catch(() => false)) {
      log(`✓ Variance indicator text matches ${color}`);
      return;
    }

    const pageBadge = this.page.getByText(pattern).first();
    if (await pageBadge.isVisible().catch(() => false)) {
      log(`✓ Variance indicator badge matches ${color}`);
      return;
    }

    const sample = await this.sampleIndicatorColor(row);
    if (
      pattern.test(sample.text) ||
      pattern.test(sample.className ?? '') ||
      this.rgbLooksLike(sample.rgb, color)
    ) {
      log(`✓ Variance indicator style/class matches ${color}`);
      return;
    }

    // Soft assert with diagnostics — UI may use icon-only colors
    expect(
      pattern.test(sample.text) ||
        pattern.test(sample.className ?? '') ||
        this.rgbLooksLike(sample.rgb, color),
      `Expected ${color} variance indicator for "${itemName}". Row text: ${sample.text.slice(0, 200)}; rgb=${sample.rgb}; class=${sample.className}`,
    ).toBeTruthy();
  }

  async saveCounts(): Promise<void> {
    await expect(this.saveCountsButton).toBeVisible({ timeout: 15000 });
    await expect(this.saveCountsButton).toBeEnabled();
    await this.saveCountsButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    const blocked = await this.page
      .getByText(/cannot save|save.*blocked|restricted|not allowed/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(blocked).toBeFalsy();
    log('✓ SAVE COUNTS completed without restriction');
  }

  async lockCount(): Promise<void> {
    const lock = this.lockCountButton.first();
    await expect(lock).toBeVisible({ timeout: 15000 });
    if (await lock.isDisabled().catch(() => false)) {
      // Some flows require save first; try save then lock
      await this.saveCounts().catch(() => undefined);
    }
    await expect(lock).toBeEnabled({ timeout: 15000 });
    await lock.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);

    const confirm = this.page.getByRole('button', {
      name: /^(confirm|lock|yes|continue)$/i,
    });
    if (await confirm.first().isVisible().catch(() => false)) {
      await confirm.first().click();
      await this.page.waitForLoadState('networkidle').catch(() => undefined);
    }

    const blocked = await this.page
      .getByText(/cannot lock|lock.*blocked|restricted|not allowed/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(blocked).toBeFalsy();
    log('✓ LOCK COUNT completed without restriction');
  }

  async saveAndLock(): Promise<void> {
    await this.saveCounts();
    await this.lockCount();
  }
}
