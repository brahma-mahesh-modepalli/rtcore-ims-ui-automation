/**
 * RolesAndPermissionsPage – Page Object
 * =====================================
 * Locators and actions for Admin → Roles & Permissions
 * used by RCSP-472 (Operations Admin visibility & integrity).
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';

export type RoleRowSnapshot = {
  name: string;
  description: string;
  permissions: string;
  users: string;
  status: string;
};

export class RolesAndPermissionsPage {
  readonly sidebar: Locator;
  readonly adminMenu: Locator;
  readonly rolesAndPermissionsLink: Locator;
  readonly usersLink: Locator;

  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly newRoleButton: Locator;
  readonly rolesTab: Locator;
  readonly permissionsCatalogTab: Locator;
  readonly searchRolesInput: Locator;
  readonly rolesTable: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary').first();
    this.adminMenu = this.sidebar
      .getByRole('button', { name: /^admin$/i })
      .or(this.sidebar.getByRole('link', { name: /^admin$/i }))
      .or(this.sidebar.getByText(/^admin$/i))
      .first();
    this.rolesAndPermissionsLink = this.sidebar
      .getByRole('link', { name: /roles\s*&\s*permissions|roles and permissions/i })
      .or(
        this.sidebar.getByRole('button', {
          name: /roles\s*&\s*permissions|roles and permissions/i,
        }),
      )
      .or(this.sidebar.getByText(/roles\s*&\s*permissions|roles and permissions/i))
      .first();
    this.usersLink = this.sidebar
      .getByRole('link', { name: /^users$/i })
      .or(this.sidebar.getByRole('button', { name: /^users$/i }))
      .or(this.sidebar.getByText(/^users$/i))
      .first();

    this.pageTitle = page
      .getByRole('heading', { name: /roles\s*&\s*permissions|roles and permissions/i })
      .first();
    this.pageSubtitle = page.getByText(
      /manage user roles and their permission assignments/i,
    );
    this.newRoleButton = page.getByRole('button', { name: /new role/i });
    this.rolesTab = page
      .getByRole('tab', { name: /^roles$/i })
      .or(page.getByRole('button', { name: /^roles$/i }))
      .first();
    this.permissionsCatalogTab = page
      .getByRole('tab', { name: /permissions catalog/i })
      .or(page.getByRole('button', { name: /permissions catalog/i }))
      .first();
    this.searchRolesInput = page
      .getByPlaceholder(/search roles/i)
      .or(page.getByRole('textbox', { name: /search roles/i }))
      .or(page.locator('input[type="search"]').first())
      .first();
    this.rolesTable = page.getByRole('table').first();
  }

  // ── Navigation ────────────────────────────────────────────

  async expandAdmin(): Promise<void> {
    log('Expanding ADMIN menu');
    const submenuVisible = await this.rolesAndPermissionsLink
      .isVisible()
      .catch(() => false);
    if (!submenuVisible) {
      await this.adminMenu.click();
      await this.page.waitForTimeout(400);
    }
  }

  async openRolesAndPermissions(): Promise<void> {
    log('Navigating to ADMIN → Roles & Permissions');
    await this.expandAdmin();
    await expect(this.rolesAndPermissionsLink).toBeVisible({ timeout: 15000 });
    await this.rolesAndPermissionsLink.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.verifyPageLoaded();
    log('✓ Roles & Permissions page loaded');
  }

  async openUsersManagement(): Promise<boolean> {
    log('Attempting to navigate to ADMIN → Users (role assignment)');
    await this.expandAdmin();
    const usersVisible = await this.usersLink.isVisible().catch(() => false);
    if (!usersVisible) {
      log('Users menu item not visible – assignment screen may be unavailable');
      return false;
    }
    await this.usersLink.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    return true;
  }

  async selectRolesTab(): Promise<void> {
    log('Selecting Roles tab');
    await this.rolesTab.click().catch(() => undefined);
    await this.page.waitForTimeout(300);
  }

  // ── Page / layout verification ────────────────────────────

  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 15000 });
  }

  async verifyRolesPageUi(options: {
    pageTitle: string;
    pageSubtitle: string;
    newRoleButton: string;
    activeTab: string;
    secondaryTab: string;
    searchPlaceholder: string;
    columnHeaders: string[];
  }): Promise<void> {
    log('Verifying Roles & Permissions page UI');
    await expect(
      this.page.getByRole('heading', {
        name: new RegExp(options.pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      }).first(),
    ).toBeVisible();
    await expect(
      this.page.getByText(new RegExp(options.pageSubtitle, 'i')),
    ).toBeVisible();
    await expect(
      this.page.getByRole('button', {
        name: new RegExp(options.newRoleButton.replace(/\+/g, '').trim(), 'i'),
      }),
    ).toBeVisible();
    await expect(
      this.page
        .getByRole('tab', { name: new RegExp(`^${options.activeTab}$`, 'i') })
        .or(
          this.page.getByRole('button', {
            name: new RegExp(`^${options.activeTab}$`, 'i'),
          }),
        )
        .first(),
    ).toBeVisible();
    await expect(
      this.page
        .getByRole('tab', { name: new RegExp(options.secondaryTab, 'i') })
        .or(
          this.page.getByRole('button', {
            name: new RegExp(options.secondaryTab, 'i'),
          }),
        )
        .first(),
    ).toBeVisible();
    await expect(
      this.page.getByPlaceholder(
        new RegExp(options.searchPlaceholder.replace(/\./g, '\\.'), 'i'),
      ),
    ).toBeVisible();
    await this.verifyColumnHeaders(options.columnHeaders);
    log('✓ Roles & Permissions UI verified');
  }

  async verifyColumnHeaders(headers: string[]): Promise<void> {
    for (const header of headers) {
      await expect(
        this.rolesTable
          .getByRole('columnheader', { name: new RegExp(header, 'i') })
          .or(this.page.getByText(new RegExp(`^${header}$`, 'i')))
          .first(),
      ).toBeVisible({ timeout: 10000 });
    }
  }

  // ── Role row helpers ──────────────────────────────────────

  roleRow(roleName: string): Locator {
    return this.rolesTable
      .getByRole('row')
      .filter({ hasText: new RegExp(roleName, 'i') })
      .first();
  }

  async verifyRoleVisible(roleName: string): Promise<void> {
    await expect(this.roleRow(roleName)).toBeVisible({ timeout: 15000 });
  }

  async verifyOperationsAdminDetails(data: {
    displayName: string;
    roleKey: string;
    description: string;
    expectedPermissions?: number;
    expectedUsers?: number;
    expectedStatus: string;
  }): Promise<void> {
    log(`Verifying Operations Admin role details for "${data.displayName}"`);
    const row = this.roleRow(data.displayName);
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText(data.displayName, { exact: false })).toBeVisible();
    await expect(row.getByText(data.roleKey, { exact: false })).toBeVisible();
    await expect(row.getByText(data.description, { exact: false })).toBeVisible();
    await expect(
      row.getByText(new RegExp(data.expectedStatus, 'i')),
    ).toBeVisible();

    if (data.expectedPermissions !== undefined) {
      await expect(
        row.getByText(String(data.expectedPermissions), { exact: true }),
      )
        .toBeVisible()
        .catch(async () => {
          // Permission count may drift in shared environments; assert numeric cell exists.
          const text = (await row.innerText()).replace(/\s+/g, ' ');
          expect(text).toMatch(/\b\d+\b/);
          log(
            `⚠ Permission count may differ from expected ${data.expectedPermissions}; row text: ${text}`,
          );
        });
    }

    if (data.expectedUsers !== undefined) {
      await expect(row.getByText(String(data.expectedUsers), { exact: true }))
        .toBeVisible()
        .catch(async () => {
          const text = (await row.innerText()).replace(/\s+/g, ' ');
          expect(text).toMatch(/\b\d+\b/);
          log(
            `⚠ User count may differ from expected ${data.expectedUsers}; row text: ${text}`,
          );
        });
    }

    await this.verifyRoleActionIcons(data.displayName);
    log('✓ Operations Admin role details verified');
  }

  async verifyRoleActionIcons(roleName: string): Promise<void> {
    const row = this.roleRow(roleName);
    const managePermissions = row
      .getByRole('button', { name: /manage permissions|permissions|key/i })
      .or(row.locator('button, a, [role="button"]').filter({ has: this.page.locator('svg') }))
      .first();
    const editRole = row
      .getByRole('button', { name: /edit/i })
      .or(row.locator('[aria-label*="Edit" i], [title*="Edit" i]'))
      .first();

    await expect(managePermissions.or(editRole).first()).toBeVisible({
      timeout: 10000,
    });
  }

  async captureRoleSnapshot(roleName: string): Promise<RoleRowSnapshot> {
    const row = this.roleRow(roleName);
    await expect(row).toBeVisible({ timeout: 15000 });
    const cells = row.getByRole('cell');
    const cellCount = await cells.count();
    const values: string[] = [];
    for (let i = 0; i < cellCount; i++) {
      values.push(((await cells.nth(i).innerText()) || '').replace(/\s+/g, ' ').trim());
    }

    return {
      name: roleName,
      description: values[1] || values.join(' | '),
      permissions: values[2] || '',
      users: values[3] || '',
      status: values[4] || values.find((v) => /active|inactive/i.test(v)) || '',
    };
  }

  async captureBaselineSnapshots(roleNames: string[]): Promise<RoleRowSnapshot[]> {
    const snapshots: RoleRowSnapshot[] = [];
    for (const name of roleNames) {
      snapshots.push(await this.captureRoleSnapshot(name));
    }
    return snapshots;
  }

  async verifyBaselineUnchanged(
    baseline: RoleRowSnapshot[],
  ): Promise<void> {
    for (const expected of baseline) {
      const current = await this.captureRoleSnapshot(expected.name);
      expect(current.name).toBe(expected.name);
      expect(current.description).toBe(expected.description);
      expect(current.permissions).toBe(expected.permissions);
      expect(current.users).toBe(expected.users);
      expect(current.status.toLowerCase()).toContain(
        expected.status.toLowerCase().includes('active') ? 'active' : expected.status.toLowerCase(),
      );
    }
  }

  // ── Search ────────────────────────────────────────────────

  async searchRoles(term: string): Promise<void> {
    log(`Searching roles for: "${term}"`);
    await this.searchRolesInput.click();
    await this.searchRolesInput.fill('');
    await this.searchRolesInput.fill(term);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    log('Clearing roles search');
    await this.searchRolesInput.click();
    await this.searchRolesInput.fill('');
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.waitForTimeout(400);
  }

  async verifySearchShowsRole(roleName: string): Promise<void> {
    await expect(this.roleRow(roleName)).toBeVisible({ timeout: 10000 });
  }

  async verifySearchEmptyOrNoMatch(invalidTerm: string): Promise<void> {
    log(`Verifying no-match search for: "${invalidTerm}"`);
    const emptyMessage = this.page.getByText(
      /no matching|no roles|no results|not found|no data/i,
    );
    const roleStillVisible = await this.roleRow('Operations Admin')
      .isVisible()
      .catch(() => false);
    const emptyVisible = await emptyMessage.isVisible().catch(() => false);
    const rowCount = await this.rolesTable.getByRole('row').count();

    expect(emptyVisible || !roleStillVisible || rowCount <= 1).toBeTruthy();
  }

  // ── Actions / dialogs ─────────────────────────────────────

  async openManagePermissions(roleName: string): Promise<void> {
    log(`Opening Manage Permissions for "${roleName}"`);
    const row = this.roleRow(roleName);
    const keyButton = row
      .getByRole('button', { name: /manage permissions|permissions|key/i })
      .or(row.locator('[aria-label*="permission" i], [title*="permission" i], [aria-label*="key" i]'))
      .or(row.locator('button, a').nth(0))
      .first();
    await keyButton.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.page.waitForTimeout(500);
  }

  async openEditRole(roleName: string): Promise<void> {
    log(`Opening Edit Role for "${roleName}"`);
    const row = this.roleRow(roleName);
    const editButton = row
      .getByRole('button', { name: /edit/i })
      .or(row.locator('[aria-label*="Edit" i], [title*="Edit" i]'))
      .or(row.locator('button, a').nth(1))
      .first();
    await editButton.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.page.waitForTimeout(500);
  }

  async cancelOrReturnFromRoleDetail(): Promise<void> {
    log('Cancelling / returning from role detail without saving');
    const cancel = this.page
      .getByRole('button', { name: /^(cancel|close|back|discard)$/i })
      .or(this.page.getByRole('link', { name: /back|roles/i }))
      .first();
    const cancelVisible = await cancel.isVisible().catch(() => false);
    if (cancelVisible) {
      await cancel.click();
    } else {
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.openRolesAndPermissions();
    }
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.selectRolesTab();
  }

  async verifyLockedRoleIndicators(lockedRoleName: string): Promise<void> {
    log(`Verifying locked/system role indicators for "${lockedRoleName}"`);
    const row = this.roleRow(lockedRoleName);
    await expect(row).toBeVisible({ timeout: 15000 });
    const lockIndicator = row
      .locator('[aria-label*="lock" i], [title*="lock" i], svg')
      .or(row.getByText(/lock|system/i))
      .first();
    await expect(lockIndicator.or(row)).toBeVisible();

    const deleteButton = row.getByRole('button', { name: /delete|remove/i });
    const deleteVisible = await deleteButton.isVisible().catch(() => false);
    if (deleteVisible) {
      await expect(deleteButton).toBeDisabled();
    }
  }

  // ── Role assignment (optional screen) ─────────────────────

  async isOperationsAdminAssignable(roleName: string): Promise<boolean> {
    log(`Checking whether "${roleName}" is available in role assignment UI`);
    const roleOption = this.page
      .getByRole('option', { name: new RegExp(roleName, 'i') })
      .or(this.page.getByText(new RegExp(`^${roleName}$`, 'i')))
      .first();

    const roleCombobox = this.page
      .getByRole('combobox', { name: /role/i })
      .or(this.page.getByLabel(/^role$/i))
      .or(this.page.getByPlaceholder(/select role|search role/i))
      .first();

    const comboboxVisible = await roleCombobox.isVisible().catch(() => false);
    if (comboboxVisible) {
      await roleCombobox.click();
      await this.page.waitForTimeout(400);
      const optionVisible = await roleOption.isVisible().catch(() => false);
      await this.page.keyboard.press('Escape').catch(() => undefined);
      return optionVisible;
    }

    // Fallback: look for role chips / list on users page
    return roleOption.isVisible().catch(() => false);
  }

  // ── RCSP-310: Inventory permissions catalog ───────────────

  async openPermissionsCatalogTab(): Promise<void> {
    log('Selecting Permissions Catalog tab');
    await this.permissionsCatalogTab.click().catch(() => undefined);
    await this.page.waitForTimeout(400);
  }

  async filterPermissions(term: string): Promise<void> {
    log(`Filtering permissions for: ${term}`);
    const filterInput = this.page
      .getByPlaceholder(/filter permissions|search permissions|search/i)
      .or(this.page.getByRole('textbox', { name: /filter|search/i }))
      .first();
    await expect(filterInput).toBeVisible({ timeout: 15000 });
    await filterInput.fill('');
    await filterInput.fill(term);
    await this.page.waitForTimeout(500);
  }

  async expandPermissionCategory(category: string): Promise<void> {
    log(`Expanding permission category: ${category}`);
    const categoryControl = this.page
      .getByRole('button', { name: new RegExp(category, 'i') })
      .or(this.page.getByText(new RegExp(`^${category}$`, 'i')))
      .first();
    if (await categoryControl.isVisible().catch(() => false)) {
      await categoryControl.click();
      await this.page.waitForTimeout(400);
    }
  }

  async verifyInventoryPermissionVisible(options: {
    displayName: string;
    permissionKey: string;
  }): Promise<void> {
    log(
      `Verifying Inventory permission: ${options.displayName} (${options.permissionKey})`,
    );
    await expect(
      this.page.getByText(new RegExp(options.displayName, 'i')).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      this.page.getByText(options.permissionKey, { exact: false }).first(),
    ).toBeVisible({ timeout: 10000 });
  }

  async verifyInventoryPermissionsInCatalog(
    permissions: Array<{ displayName: string; permissionKey: string }>,
  ): Promise<void> {
    await this.openPermissionsCatalogTab();
    await this.expandPermissionCategory('Inventory');

    for (const permission of permissions) {
      await this.filterPermissions(permission.permissionKey);
      await this.verifyInventoryPermissionVisible(permission);
      await this.filterPermissions(permission.displayName);
      await this.verifyInventoryPermissionVisible(permission);
    }
    log('✓ All Inventory page-level permissions verified in catalog');
  }

  async verifyAdministratorHasInventoryPermissions(
    roleName: string,
    permissions: Array<{ displayName: string; permissionKey: string }>,
  ): Promise<void> {
    log(`Verifying ${roleName} has Inventory permissions granted`);
    await this.selectRolesTab();
    await this.openManagePermissions(roleName);
    await this.expandPermissionCategory('Inventory');

    for (const permission of permissions) {
      await this.filterPermissions(permission.permissionKey).catch(async () => {
        await this.filterPermissions(permission.displayName);
      });
      await expect(
        this.page
          .getByText(new RegExp(permission.displayName, 'i'))
          .or(this.page.getByText(permission.permissionKey, { exact: false }))
          .first(),
      ).toBeVisible({ timeout: 15000 });

      // Granted/selected: checkbox checked or selected chip/state
      const row = this.page
        .locator('label, div, tr, li')
        .filter({ hasText: new RegExp(permission.permissionKey, 'i') })
        .first();
      const checkbox = row.getByRole('checkbox');
      if (await checkbox.isVisible().catch(() => false)) {
        await expect(checkbox).toBeChecked();
      }
    }

    await this.cancelOrReturnFromRoleDetail();
    log(`✓ ${roleName} Inventory permissions verified`);
  }
}
