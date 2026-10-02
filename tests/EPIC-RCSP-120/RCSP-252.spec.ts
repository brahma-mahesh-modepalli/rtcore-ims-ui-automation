import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { CreditRequestsPage } from '../../pages/Ordering/CreditRequestsPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { TestDataRepository } from '../../test-data/TestDataRepository';

const REGION = '1700 San Antonio 4126314';
const MARKET = '1708 E Central SA 4126393';
const STORE = 'WB Unit 1034';
const DAMAGE_IMAGE = path.resolve(process.cwd(), 'test-data/fixtures/credit-request-damage.png');
const repository = new TestDataRepository();

function poLabel(poId: string): string {
	return /^PO-/i.test(poId) ? poId : `PO-${poId}`;
}

function normalizeIncidentType(description: string): string {
	return description.trim().toLocaleLowerCase();
}

async function startDamagedCreditRequest(page: Page): Promise<{ creditPage: CreditRequestsPage; poNumber: string }> {
	const poIds = await repository.getEligibleCreditRequestPurchaseOrderIds();
	test.skip(poIds.length === 0, 'No completed, unused PO for vendor 2/3 is available for a Credit Request.');
	await page.goto(CONFIG.dashboardURL);
	await page.waitForLoadState('networkidle').catch(() => undefined);
	await new RTCDashboardLoginPage(page).login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	const transfersPage = new TransfersPage(page);
	await transfersPage.switchStore(REGION, MARKET, STORE);
	await transfersPage.verifyActiveStore(STORE);

	const creditPage = new CreditRequestsPage(page);
	await creditPage.openCreditRequests();
	await creditPage.clickNewCreditRequest();
	await creditPage.verifyPoSearchVisible();

	for (const poId of poIds) {
		const poNumber = poLabel(poId);
		console.log('Trying RCSP-252 PO ID:', poId);
		const selected = await creditPage.searchAndSelectPurchaseOrder(poNumber);
		if (!selected || !(await creditPage.startCreditRequestButton.isEnabled().catch(() => false))) continue;
		await creditPage.clickStartCreditRequest();
		await creditPage.verifyDamagedItemsPageLoaded();
		const noItems = page.getByText(/no received items remain available/i).first();
		const damageLabel = page.getByText(/^damaged$/i, { exact: true }).filter({ visible: true });
		if (await noItems.isVisible().catch(() => false) || (await damageLabel.count()) === 0) {
			await creditPage.openCreditRequests();
			await creditPage.clickNewCreditRequest();
			await creditPage.verifyPoSearchVisible();
			continue;
		}
		await creditPage.selectDamaged();
		return { creditPage, poNumber };
	}

	test.skip(true, `None of the ${poIds.length} recent completed POs is selectable at ${STORE}.`);
	throw new Error('No eligible PO could be opened for a Credit Request.');
}

async function fillRequiredDamageAnswers(creditPage: CreditRequestsPage): Promise<void> {
	await creditPage.fillDamagedFields({
		orderType: 'PO',
		receivedPoSearch: '',
		incidentType: 'Damaged',
		canUseProduct: 'Yes',
		enoughGoodProductOrIut: 'Yes',
	}, { omit: ['qty', 'uom', 'images'], uploadImage: false });
}

async function uploadImages(page: Page, count: number): Promise<void> {
	const buffer = await readFile(DAMAGE_IMAGE);
	const input = page.locator('input[type="file"][multiple]').last();
	await expect(input).toBeAttached({ timeout: 15000 });
	await input.setInputFiles(Array.from({ length: count }, (_, index) => ({
		name: `rcsp-252-damage-${index + 1}.png`,
		mimeType: 'image/png',
		buffer,
	})));
}

async function expectMinimumPhotoError(page: Page): Promise<void> {
	await expect(page.getByText(/needs between 3 and 20 photos/i).first()).toBeVisible({ timeout: 15000 });
	const ok = page.getByRole('button', { name: /^ok$/i }).last();
	if (await ok.isVisible().catch(() => false)) await ok.click();
}

test.describe('RCSP-252 - Credit Request Incident Type and minimum photos', () => {
	test.setTimeout(120000);

	test('TC_RCSP-252_01 - Incident Type options exactly match active incident type descriptions', { tag: ['@functional'] }, async ({ page }) => {
		const activeDescriptions = await repository.getActiveIncidentTypeDescriptions();
		const dbReasons = [...new Set(activeDescriptions.map(normalizeIncidentType).filter(Boolean))].sort();
		expect(dbReasons.length, 'No active incident_type.description values were returned').toBeGreaterThan(0);
		const { creditPage } = await startDamagedCreditRequest(page);
		const uiReasons = [...new Set((await creditPage.getIncidentTypeOptions()).map(normalizeIncidentType).filter(Boolean))].sort();
		console.log('Active incident types from DB:', dbReasons.join(' | '));
		console.log('UI Incident Type options:', uiReasons.join(' | '));
		expect(uiReasons).toEqual(dbReasons);
	});

	test('TC_RCSP-252_02 - one and two images are rejected with the photo minimum error', { tag: ['@functional'] }, async ({ page }) => {
		const { creditPage } = await startDamagedCreditRequest(page);
		await fillRequiredDamageAnswers(creditPage);
		await uploadImages(page, 1);
		await creditPage.submitCreditRequest();
		await expectMinimumPhotoError(page);

		await uploadImages(page, 1);
		await creditPage.submitCreditRequest();
		await expectMinimumPhotoError(page);
	});

	test('TC_RCSP-252_03 - three images allow a Credit Request to be submitted', { tag: ['@functional'] }, async ({ page }) => {
		const { creditPage, poNumber } = await startDamagedCreditRequest(page);
		await fillRequiredDamageAnswers(creditPage);
		await uploadImages(page, 3);
		await creditPage.submitCreditRequest();
		await expect(page.getByText(/^submit credit request$/i).last()).toBeVisible();
		await expect(page.getByText(/once submitted, it will be locked and can no longer be edited/i).last()).toBeVisible();
		await expect(page.getByRole('button', { name: /^submit$/i }).last()).toBeVisible();
		await page.getByRole('button', { name: /^submit$/i }).last().click();
		await page.waitForLoadState('networkidle').catch(() => undefined);
		await creditPage.verifyCreditRequestsPageLoaded();
		const escapedPo = poNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const row = page.getByRole('row').filter({ hasText: new RegExp(escapedPo, 'i') }).first();
		await expect(row).toBeVisible({ timeout: 20000 });
		await expect(row).toContainText(/submitted/i);
	});
});
