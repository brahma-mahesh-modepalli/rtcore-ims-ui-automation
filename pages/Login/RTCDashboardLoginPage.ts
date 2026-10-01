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

  async loginWithMicrosoftSso(email: string, accountName: string): Promise<void> {
    log(`Starting Microsoft SSO for ${accountName} (${email})`);
    await this.page.goto(CONFIG.loginURL);
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);

    if (await this.appShell.isVisible().catch(() => false)) {
      return;
    }

    const continueButton = this.page
      .getByRole('button', { name: /continue with microsoft/i })
      .or(this.page.getByText(/continue with microsoft/i))
      .first();
    if (await continueButton.isVisible().catch(() => false)) {
      const emailInput = this.page
        .getByLabel(/^email$/i)
        .or(this.page.getByPlaceholder('you@whataburger.com'))
        .or(this.page.locator('input[type="email"]'))
        .first();
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await emailInput.fill(email);

      const microsoftRedirect = this.page.waitForURL(/login\.microsoftonline\.com/i, { timeout: 20000 }).catch(() => undefined);
      await continueButton.click();
      await microsoftRedirect;
      if (!/login\.microsoftonline\.com/i.test(this.page.url())) {
        const accountPrompt = this.page.getByText(/pick an account|use another account|enter password/i).first();
        await expect(accountPrompt, 'Continue with Microsoft did not navigate to SSO or display an account prompt').toBeVisible({ timeout: 10000 });
      }
    }

    const accountPickerEntry = this.page
      .getByText(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), { exact: false })
      .or(this.page.getByText(new RegExp(accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), { exact: false }))
      .last();

    if (await accountPickerEntry.isVisible().catch(() => false)) {
      await accountPickerEntry.click();
    }

    const passwordPrompt = this.page.getByRole('textbox', { name: /^password$/i })
      .or(this.page.locator('input[type="password"]'))
      .first();
    if (await passwordPrompt.isVisible().catch(() => false)) {
      log(`Microsoft SSO needs interactive authentication for ${accountName}; waiting for the user to complete it in the browser`);
    }

    const useAnotherAccount = this.page.getByText(/use another account/i).last();
    if (!(await accountPickerEntry.isVisible().catch(() => false)) && await useAnotherAccount.isVisible().catch(() => false)) {
      await useAnotherAccount.click();
      const signInEmail = this.page.getByRole('textbox', { name: /email|phone|skype/i }).first();
      await signInEmail.fill(email);
      await this.page.getByRole('button', { name: /next|continue/i }).first().click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    }

    if (await passwordPrompt.isVisible().catch(() => false)) {
      log(`Complete the Microsoft password/MFA prompt for ${accountName} in the browser window`);
    }

    await this.waitForAuthenticatedApp(120000);
  }

  async isLoginFormVisible(): Promise<boolean> {
    return this.usernameInput.isVisible().catch(() => false);
  }

  async waitForAuthenticatedApp(timeout = 30000): Promise<void> {
    await expect
      .poll(
        async () => {
          const appShellVisible = await this.appShell.isVisible().catch(() => false);
          const loginFormVisible = await this.isLoginFormVisible();
          return appShellVisible && !loginFormVisible;
        },
        { timeout, message: 'Waiting for authenticated dashboard shell.' },
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
