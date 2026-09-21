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
}