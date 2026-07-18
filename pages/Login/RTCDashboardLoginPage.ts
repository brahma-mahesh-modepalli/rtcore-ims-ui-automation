/**
 * RTCDashboardLoginPage – Page Object
 * ===================================
 * Encapsulates all locators and actions for the Whataburger RTC Dashboard login page.
 * URL: http://dv-backoffice.wbhq.com/login
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';

export class RTCDashboardLoginPage {
  // ── Locators ──────────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly appShell: Locator;

  constructor(private readonly page: Page) {
    // Using getBy* methods for semantic locators
    this.usernameInput = page.getByPlaceholder('you@whataburger.com');
    this.passwordInput = page.getByPlaceholder('Enter password');
    this.loginButton = page.getByRole('button', { name: 'Sign in' });
    this.appShell = page.getByRole('complementary').first();
  }

  // ── Actions ───────────────────────────────────────────────

  /** Navigate to the RTC Dashboard login page */
  async navigate(): Promise<void> {
    log('Navigating to RTC Dashboard login page');
    await this.page.goto(CONFIG.loginURL);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill in the email and password fields and click the login button.
   * @param email - The email to enter
   * @param password - The password to enter
   */
  async login(email: string, password: string): Promise<void> {
    log(`Logging in as "${email}"`);

    if (!(await this.isLoginFormVisible())) {
      await this.page.goto(CONFIG.loginURL);
      await this.page.waitForLoadState('domcontentloaded');
    }

    if (!(await this.isLoginFormVisible())) {
      await this.waitForAuthenticatedApp();
      return;
    }

    await this.usernameInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.waitForAuthenticatedApp();
  }

  async isLoginFormVisible(): Promise<boolean> {
    return this.usernameInput.isVisible().catch(() => false);
  }

  async waitForAuthenticatedApp(): Promise<void> {
    await expect
      .poll(
        async () => {
          const appShellVisible = await this.appShell.isVisible().catch(() => false);
          const loginFormVisible = await this.isLoginFormVisible();
          return appShellVisible && !loginFormVisible;
        },
        { timeout: 30000, message: 'Waiting for authenticated dashboard shell.' },
      )
      .toBe(true);
  }

  // ── Validations ───────────────────────────────────────────

  /** Assert that the login page has loaded correctly */
  async validatePageLoaded(): Promise<void> {
    log('Validating RTC Dashboard login page loaded');
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /** Assert that login was successful by checking URL change */
  async validateSuccessfulLogin(): Promise<void> {
    log('Validating successful login');
    await expect(this.page).not.toHaveURL(/\/login$/);
    // Wait for navigation away from login page
    await this.page.waitForTimeout(1000);
  }



  /** Assert that the page still shows login form (login failed) */
  async validateLoginPageStillVisible(): Promise<void> {
    log('Validating login page still visible');
    await expect(this.usernameInput).toBeVisible();
  }
}
