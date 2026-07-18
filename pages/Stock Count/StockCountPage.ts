/**
 * StockCountPage – Page Object
 * =============================
 * Encapsulates all locators and actions for Stock Count menu navigation.
 * Handles expanding the STOCK COUNT menu and navigating to various count pages:
 * - Daily Shift Count
 * - Weekly Count
 * - Monthly Count
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export class StockCountPage {
  // ── Locators ──────────────────────────────────────────────
  private stockCountMenu: Locator;
  private dailyShiftCountOption: Locator;
  private weeklyCountOption: Locator;
  private monthlyCountOption: Locator;
  private dailyShiftCountTitle: Locator;
  private weeklyCountTitle: Locator;
  private monthlyCountTitle: Locator;
  

  constructor(private readonly page: Page) {
    // Stock Count menu and options locators - Using flexible selectors
    this.stockCountMenu = page.getByRole('button', { name: 'Stock Count' });
    this.dailyShiftCountOption = page.getByRole('link', { name: 'Daily Shift Count' });
    this.weeklyCountOption = page.getByRole('link', { name: 'Weekly Count' });
    this.monthlyCountOption = page.getByRole('link', { name: 'Monthly Count' });

    // Page title locators for verification - More flexible matching
    this.dailyShiftCountTitle = page.getByRole('heading', { name: 'Daily Shift Count' });
    this.weeklyCountTitle = page.getByRole('heading', { name: 'Weekly Count' });
    this.monthlyCountTitle = page.getByRole('heading', { name: 'Monthly Count' });
  }

  // ── Private Helper Methods ────────────────────────────────

  /**
   * Expand the STOCK COUNT menu if not already expanded
   * @private
   */
  private async expandStockCountMenu(): Promise<void> {
    log('Expanding STOCK COUNT menu from left navigation panel');
    await this.page.waitForTimeout(500); // Wait for page to settle
    
    // Try to find and click the menu
    const menuVisible = await this.stockCountMenu.isVisible().catch(() => false);
    if (!menuVisible) {
      log('Menu element not visible, trying to locate it again...');
      await this.page.waitForLoadState('networkidle');
    }
    
    await this.stockCountMenu.click();
    await this.page.waitForTimeout(1000); // Wait for menu animation
    log('✓ STOCK COUNT menu expanded');
  }

  /**
   * Navigate back to the STOCK COUNT menu
   * @private
   */
  private async navigateBackToMenu(): Promise<void> {
    log('Navigating back to STOCK COUNT menu');
    await this.page.waitForTimeout(500);
    await this.stockCountMenu.click();
    await this.page.waitForTimeout(1000);
    log('✓ Returned to STOCK COUNT menu');
  }

  // ── Public Actions ────────────────────────────────────────

  /**
   * Click on Daily Shift Count option
   */
  async clickDailyShiftCount(): Promise<void> {
    log('Clicking on Daily Shift Count');
    
    // Try to find the element with better error messaging
    try {
      await this.dailyShiftCountOption.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        log('⚠ Element not immediately visible, proceeding anyway');
      });
      await this.dailyShiftCountOption.click();
    } catch (error) {
      log('Error clicking Daily Shift Count: ' + String(error));
      throw error;
    }
    
    await this.page.waitForLoadState('networkidle');
    log('✓ Daily Shift Count page loaded');
  }

  /**
   * Click on Weekly Count option
   */
  async clickWeeklyCount(): Promise<void> {
    log('Clicking on Weekly Count');
    
    try {
      await this.weeklyCountOption.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        log('⚠ Element not immediately visible, proceeding anyway');
      });
      await this.weeklyCountOption.click();
    } catch (error) {
      log('Error clicking Weekly Count: ' + String(error));
      throw error;
    }
    
    await this.page.waitForLoadState('networkidle');
    log('✓ Weekly Count page loaded');
  }

  /**
   * Click on Monthly Count option
   */
  async clickMonthlyCount(): Promise<void> {
    log('Clicking on Monthly Count');
    
    try {
      await this.monthlyCountOption.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        log('⚠ Element not immediately visible, proceeding anyway');
      });
      await this.monthlyCountOption.click();
    } catch (error) {
      log('Error clicking Monthly Count: ' + String(error));
      throw error;
    }
    
    await this.page.waitForLoadState('networkidle');
    log('✓ Monthly Count page loaded');
  }

  // ── Public Validation Methods ─────────────────────────────

  /**
   * Verify Daily Shift Count page is displayed
   */
  async verifyDailyShiftCountPageLoaded(): Promise<void> {
    await expect(this.dailyShiftCountTitle).toBeVisible();
    log('✓ Verified: Daily Shift Count page is displayed');
  }

  /**
   * Verify Weekly Count page is displayed
   */
  async verifyWeeklyCountPageLoaded(): Promise<void> {
    await expect(this.weeklyCountTitle).toBeVisible();
    log('✓ Verified: Weekly Count page is displayed');
  }

  /**
   * Verify Monthly Count page is displayed
   */
  async verifyMonthlyCountPageLoaded(): Promise<void> {
    await expect(this.monthlyCountTitle).toBeVisible();
    log('✓ Verified: Monthly Count page is displayed');
  }

  // ── Public Flow Methods ───────────────────────────────────

  /**
   * Navigate to Daily Shift Count from menu
   * Expands menu and clicks Daily Shift Count option
   */
  async navigateToDailyShiftCount(): Promise<void> {
    await this.expandStockCountMenu();
    await this.clickDailyShiftCount();
    await this.verifyDailyShiftCountPageLoaded();
  }

  /**
   * Navigate to Weekly Count from menu
   * Goes back to menu, expands it, and clicks Weekly Count option
   */
  async navigateToWeeklyCount(): Promise<void> {
    const weeklyCountVisible = await this.weeklyCountOption.isVisible().catch(() => false);
    if (!weeklyCountVisible) {
      await this.expandStockCountMenu();
    }

    await this.clickWeeklyCount();
    await this.verifyWeeklyCountPageLoaded();
  }

  /**
   * Navigate to Monthly Count from menu
   * Goes back to menu, expands it, and clicks Monthly Count option
   */
  async navigateToMonthlyCount(): Promise<void> {
    const monthlyCountVisible = await this.monthlyCountOption.isVisible().catch(() => false);
    if (!monthlyCountVisible) {
      await this.expandStockCountMenu();
    }

    await this.clickMonthlyCount();
    await this.verifyMonthlyCountPageLoaded();
  }

  /**
   * RCSP-171: expand Stock Count and assert Spot/Daily Count removed;
   * Daily Shift Count / Weekly / Monthly remain.
   */
  async verifyUnifiedStockCountMenu(
    requiredMenus: string[],
    forbiddenMenus: string[],
  ): Promise<void> {
    await this.expandStockCountMenu();

    for (const name of requiredMenus) {
      const link = this.page.getByRole('link', { name: new RegExp(`^${name}$`, 'i') });
      await expect(link.first()).toBeVisible({ timeout: 10000 });
      log(`✓ Required menu present: ${name}`);
    }

    for (const name of forbiddenMenus) {
      const link = this.page.getByRole('link', { name: new RegExp(`^${name}$`, 'i') });
      await expect(link).toHaveCount(0);
      log(`✓ Forbidden menu absent: ${name}`);
    }
  }
}
