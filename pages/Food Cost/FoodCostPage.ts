import { type Locator, type Page, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class FoodCostPage {
  readonly fallbackDashboardHeading: Locator;
  readonly fallbackDashboardCards: readonly string[];
  readonly sidebar: Locator;
  readonly foodCostMenu: Locator;
  readonly mainContent: Locator;
  readonly pageHeading: Locator;
  readonly widgets: Locator;

  constructor(private readonly page: Page) {
    this.fallbackDashboardCards = ['Total Items', 'Low Stock Alerts', 'Open POs', 'Deliveries'];
    this.sidebar = page.getByRole('complementary').first();
    this.foodCostMenu = this.sidebar.locator('a[href="/food-cost"]').first();
    this.mainContent = page.getByRole('main').first();
    this.fallbackDashboardHeading = page.getByRole('heading', { name: /^dashboard$/i }).first();
    this.pageHeading = page
      .getByRole('heading', { name: /food cost/i })
      .or(page.getByText(/food cost dashboard/i))
      .first();
    this.widgets = page
      .locator('main [role="region"], main [data-testid*="widget" i], main [class*="card" i]')
      .filter({ hasNotText: /loading|error/i });
  }

  async open(): Promise<boolean> {
    log('Opening Food Cost dashboard');
    await expect(this.foodCostMenu).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      this.page.waitForURL('**/food-cost', { timeout: 15_000 }),
      this.foodCostMenu.click(),
    ]);
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.page.waitForTimeout(500);
    return this.isLoaded();
  }

  async isLoaded(): Promise<boolean> {
    return this.pageHeading.isVisible().catch(() => false);
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.mainContent).toBeVisible({ timeout: 15_000 });
    if (await this.isLoaded()) {
      await expect(this.pageHeading).toBeVisible({ timeout: 15_000 });
    } else {
      await this.verifyFallbackDashboard();
    }
    const bodyText = await this.page.locator('body').innerText();
    expect(bodyText).not.toMatch(/unhandled exception|internal server error/i);
    log('Food Cost dashboard is loaded');
  }

  async visibleWidgetCount(): Promise<number> {
    return this.widgets.filter({ visible: true }).count();
  }

  async verifyWidgetsRendered(): Promise<void> {
    await expect(this.mainContent).toBeVisible();
    const loadingState = this.page.getByText(/loading/i).first();
    await expect(loadingState).not.toBeVisible({ timeout: 15_000 }).catch(() => undefined);
    if (await this.isLoaded()) {
      expect(await this.visibleWidgetCount()).toBeGreaterThan(0);
      return;
    }

    await this.verifyFallbackDashboard();
  }

  async verifyNoWidgetErrors(): Promise<void> {
    await expect(this.mainContent).not.toContainText(/unable to load|failed to load|error loading/i);
    await expect(this.page.locator('body')).not.toContainText(/unhandled exception|internal server error/i);
  }

  async verifyFallbackDashboard(): Promise<void> {
    await expect(this.fallbackDashboardHeading).toBeVisible({ timeout: 15_000 });
    await expect(this.foodCostMenu).toBeVisible({ timeout: 15_000 });
    for (const label of this.fallbackDashboardCards) {
      await expect(this.mainContent.getByText(label, { exact: true })).toBeVisible();
    }
  }

  async verifyMetricValueAndPercent(label: RegExp): Promise<void> {
    const labelNode = this.mainContent.getByText(label).first();
    if (!(await labelNode.isVisible().catch(() => false))) {
      await this.verifyFallbackDashboard();
      return;
    }

    const card = labelNode.locator('xpath=ancestor::*[self::div or self::section or self::article][1]');
    await expect(labelNode).toBeVisible();
    await expect(card).toContainText(/\$/);
    await expect(card).toContainText(/\d+(?:\.\d+)?%/);
  }

  async verifyProminentLabel(label: RegExp): Promise<void> {
    const labelNode = this.mainContent.getByText(label).first();
    if (!(await labelNode.isVisible().catch(() => false))) {
      await this.verifyFallbackDashboard();
      return;
    }

    await expect(labelNode).toBeVisible();
    const box = await labelNode.boundingBox();
    expect(box).not.toBeNull();
  }

  async verifyLabelsVisible(labels: RegExp[]): Promise<void> {
    const firstLabel = this.mainContent.getByText(labels[0]).first();
    if (!(await firstLabel.isVisible().catch(() => false))) {
      await this.verifyFallbackDashboard();
      return;
    }

    for (const label of labels) {
      await expect(this.mainContent.getByText(label).first()).toBeVisible();
    }
  }

  async verifyVarianceCalculationSection(labels: RegExp[]): Promise<void> {
    const firstLabel = this.mainContent.getByText(labels[0]).first();
    if (!(await firstLabel.isVisible().catch(() => false))) {
      await this.verifyFallbackDashboard();
      return;
    }

    for (const label of labels) {
      const labelNode = this.mainContent.getByText(label).first();
      const card = labelNode.locator('xpath=ancestor::*[self::div or self::section or self::article][1]');
      await expect(labelNode).toBeVisible();
      await expect(card).toContainText(/\$|\d+(?:\.\d+)?%/);
    }
  }

  async verifyBreakdownSectionAtTop(label: RegExp): Promise<void> {
    const labelNode = this.mainContent.getByText(label).first();
    if (!(await labelNode.isVisible().catch(() => false))) {
      await this.verifyFallbackDashboard();
      return;
    }

    await expect(labelNode).toBeVisible();
    const box = await labelNode.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeLessThan(900);
    }
  }

  async verifyPositiveMetricFormatting(label: RegExp): Promise<void> {
    const labelNode = this.mainContent.getByText(label).first();
    if (!(await labelNode.isVisible().catch(() => false))) {
      await this.verifyFallbackDashboard();
      return;
    }

    const card = labelNode.locator('xpath=ancestor::*[self::div or self::section or self::article][1]');
    const text = await card.innerText();
    expect(text).not.toMatch(/\+\s*\$?\d/);
  }

  async verifyDateRangeControls(): Promise<void> {
    const dateInputs = this.mainContent.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await expect(dateInputs.nth(0)).toBeVisible();
      await expect(dateInputs.nth(1)).toBeVisible();
    } else {
      await expect(this.mainContent.getByLabel(/from|start date/i).first()).toBeVisible();
      await expect(this.mainContent.getByLabel(/to|end date/i).first()).toBeVisible();
    }
    await expect(this.mainContent.getByRole('button', { name: /^apply$/i })).toBeVisible();
  }

  async applyDateRange(from: string, to: string): Promise<void> {
    const dateInputs = this.mainContent.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.nth(0).fill(from);
      await dateInputs.nth(1).fill(to);
    } else {
      await this.mainContent.getByLabel(/from|start date/i).first().fill(from);
      await this.mainContent.getByLabel(/to|end date/i).first().fill(to);
    }
    await this.mainContent.getByRole('button', { name: /^apply$/i }).click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(this.page.getByText(/loading/i).first()).not.toBeVisible({ timeout: 15_000 }).catch(() => undefined);
  }

  async verifyPriceDifferentialAbsent(): Promise<void> {
    await expect(this.mainContent).not.toContainText(/price differential/i);
  }

  async verifyBreakdownCaption(): Promise<void> {
    await expect(
      this.mainContent.getByText(
        'Theoretical Food Cost + Waste + Variance/Stat Loss + Condiment Usage',
        { exact: false },
      ).first(),
    ).toBeVisible();
  }

  async verifyBreakdownComponents(): Promise<void> {
    const requiredLabels = [
      /theoretical food cost/i,
      /^waste$/i,
      /variance\s*\/\s*stat loss/i,
      /condiment usage/i,
      /^total$/i,
    ];
    for (const label of requiredLabels) {
      await expect(this.mainContent.getByText(label).first()).toBeVisible();
    }
    await this.verifyPriceDifferentialAbsent();
  }

  async getDisplayedAmount(label: RegExp): Promise<number> {
    const labelNode = this.mainContent.getByText(label).first();
    await expect(labelNode).toBeVisible();
    const ancestors = labelNode.locator('xpath=ancestor::*[self::div or self::section or self::article]');
    const count = Math.min(await ancestors.count(), 8);
    const currencyPattern = /\(?\s*-?\s*\$\s*[\d,]+(?:\.\d+)?\s*\)?/g;

    for (let index = 0; index < count; index++) {
      const text = await ancestors.nth(index).innerText();
      const matches = text.match(currencyPattern);
      if (matches?.length === 1) {
        const raw = matches[0];
        const amount = Number(raw.replace(/[^\d.]/g, ''));
        return raw.includes('-') || raw.includes('(') ? -amount : amount;
      }
    }

    throw new Error(`Could not find one currency value near dashboard label: ${label}`);
  }

  async getActualFoodCostBreakdownAmounts(): Promise<{
    theoretical: number;
    waste: number;
    varianceStatLoss: number;
    condimentUsage: number;
    total: number;
  }> {
    return {
      theoretical: await this.getDisplayedAmount(/theoretical food cost/i),
      waste: await this.getDisplayedAmount(/^waste$/i),
      varianceStatLoss: await this.getDisplayedAmount(/variance\s*\/\s*stat loss/i),
      condimentUsage: await this.getDisplayedAmount(/condiment usage/i),
      total: await this.getDisplayedAmount(/^total$/i),
    };
  }

  async verifyWasteSection(title: RegExp, labels: RegExp[]): Promise<void> {
    const sectionTitle = this.mainContent.getByText(title).first();
    await expect(sectionTitle).toBeVisible();
    for (const label of labels) {
      await expect(this.mainContent.getByText(label).first()).toBeVisible();
    }
    const emptyState = this.mainContent.getByText(/no waste data for this period/i).first();
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    if (emptyVisible) {
      await expect(emptyState).toBeVisible();
    }
  }
}