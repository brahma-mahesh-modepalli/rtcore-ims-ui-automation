/**
 * ActiveBatchPage – Page Object
 * ==============================
 * Locators and actions for the external ActiveBatch application used to
 * transmit Scheduled Orders to vendors (RCSP-246). Selectors are kept
 * resilient (role/text based) because this is a third-party application
 * whose DOM is not controlled by this repository.
 */

import { type Page, expect } from '@playwright/test';
import { log } from '../../utils/helpers';
import { ExternalSystemCredentials } from '../../config/externalCredentials';

export class ActiveBatchPage {
	constructor(private readonly page: Page) {}

	async open(): Promise<boolean> {
		const { url } = ExternalSystemCredentials.activeBatch;
		log(`Launching ActiveBatch: ${url}`);
		const response = await this.page
			.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
			.catch(() => null);
		return Boolean(response);
	}

	async loginViaConnectionManager(): Promise<boolean> {
		const { username, password } = ExternalSystemCredentials.activeBatch;
		if (!username || !password) {
			log('ActiveBatch credentials are not configured (ACTIVEBATCH_USERNAME/ACTIVEBATCH_PASSWORD)');
			return false;
		}

		const connectionManagerButton = this.page
			.getByRole('button', { name: /connection manager/i })
			.or(this.page.getByRole('link', { name: /connection manager/i }))
			.or(this.page.getByText(/connection manager/i))
			.first();

		if (!(await connectionManagerButton.isVisible({ timeout: 15_000 }).catch(() => false))) {
			return false;
		}

		await connectionManagerButton.click();

		const usernameInput = this.page
			.getByLabel(/user\s*name|username/i)
			.or(this.page.getByPlaceholder(/user\s*name|username/i))
			.first();
		const passwordInput = this.page
			.getByLabel(/password/i)
			.or(this.page.getByPlaceholder(/password/i))
			.first();

		if (!(await usernameInput.isVisible({ timeout: 10_000 }).catch(() => false))) {
			return false;
		}

		await usernameInput.fill(username);
		await passwordInput.fill(password);

		const loginButton = this.page
			.getByRole('button', { name: /^(log ?in|sign in|connect|ok)$/i })
			.first();
		await loginButton.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		return true;
	}

	async triggerJob(pathSegments: string[]): Promise<{ triggered: boolean; reason?: string }> {
		for (const segment of pathSegments) {
			const node = this.page.getByText(new RegExp(`^${segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')).first();
			if (!(await node.isVisible({ timeout: 10_000 }).catch(() => false))) {
				return { triggered: false, reason: `ActiveBatch path segment not found: ${segment}` };
			}
			await node.click().catch(() => undefined);
		}

		const finalSegment = pathSegments[pathSegments.length - 1];
		const finalNode = this.page.getByText(new RegExp(`^${finalSegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')).first();

		if (!(await finalNode.isVisible().catch(() => false))) {
			return { triggered: false, reason: `Unable to locate final ActiveBatch job node: ${finalSegment}` };
		}

		await finalNode.click({ button: 'right' }).catch(() => undefined);

		const triggerMenuItem = this.page
			.getByRole('menuitem', { name: /^trigger$/i })
			.or(this.page.getByText(/^trigger$/i))
			.first();

		if (!(await triggerMenuItem.isVisible({ timeout: 5_000 }).catch(() => false))) {
			return { triggered: false, reason: 'Trigger context menu item was not available.' };
		}

		await triggerMenuItem.click();
		await this.page.waitForLoadState('networkidle').catch(() => undefined);

		return { triggered: true };
	}
}
