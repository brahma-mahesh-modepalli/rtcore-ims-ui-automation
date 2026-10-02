import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { CreditRequestsPage, type CreditRequestVendorData } from '../../pages/Ordering/CreditRequestsPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { TestDataRepository } from '../../test-data/TestDataRepository';

const STORE_ID = 37;
const REGION = '1700 San Antonio 4126314';
const MARKET = '1708 E Central SA 4126393';
const STORE = 'WB Unit 1034';
const DAMAGE_IMAGE = path.resolve(process.cwd(), 'test-data/fixtures/credit-request-damage.png');
const repository = new TestDataRepository();

function poLabel(poId: string): string {
	return /^PO-/i.test(poId) ? poId : `PO-${poId}`;
}

async function startCreditRequest(page: Page): Promise<{ creditPage: CreditRequestsPage; poId: string; poNumber: string }> {
	const poIds = await repository.getEligibleCreditRequestPurchaseOrderIds();
	test.skip(poIds.length === 0, 'No completed PO for vendor 2/3 without a credit memo is available in the database.');

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
		console.log('Trying RCSP-27 PO ID:', poId);
		const selected = await creditPage.searchAndSelectPurchaseOrder(poNumber);
		if (!selected || !(await creditPage.startCreditRequestButton.isEnabled().catch(() => false))) {
			continue;
		}
		await creditPage.clickStartCreditRequest();
		await creditPage.verifyDamagedItemsPageLoaded();
		const noReceivedItems = page.getByText(/no received items remain available/i).first();
		const damageControls = page.getByText(/^damaged$/i, { exact: true }).filter({ visible: true });
		if (await noReceivedItems.isVisible().catch(() => false) || await damageControls.count() === 0) {
			console.log(`Skipping PO ${poNumber}: no received item is available to mark damaged`);
			await creditPage.openCreditRequests();
			await creditPage.clickNewCreditRequest();
			await creditPage.verifyPoSearchVisible();
			continue;
		}
		await creditPage.selectDamaged();
		return { creditPage, poId, poNumber };
	}

	test.skip(true, `None of the ${poIds.length} recent database candidate POs is selectable for a Credit Request at ${STORE}.`);
	throw new Error('No selectable PO was found after skipping the test.');
}

function validDamagedItemFields(): CreditRequestVendorData {
	return {
		orderType: 'PO',
		receivedPoSearch: '',
		incidentType: 'Damaged',
		canUseProduct: 'Yes',
		enoughGoodProductOrIut: 'Yes',
	};
}

async function uploadImageCount(page: Page, count: number): Promise<void> {
	const buffer = await readFile(DAMAGE_IMAGE);
	const input = page.locator('input[type="file"][multiple]').last();
	await expect(input).toBeAttached({ timeout: 15000 });
	await input.setInputFiles(Array.from({ length: count }, (_, index) => ({
			name: `rcsp-27-damage-${index + 1}.png`,
			mimeType: 'image/png',
			buffer,
		})));
}

async function expectPhotoCountValidation(page: Page): Promise<void> {
	const message = page.getByText(/needs between 3 and 20 photos/i).first();
	await expect(message).toBeVisible({ timeout: 15000 });
	const ok = page.getByRole('button', { name: /^ok$/i }).last();
	if (await ok.isVisible().catch(() => false)) await ok.click();
}

async function fillValidFields(page: Page, creditPage: CreditRequestsPage): Promise<void> {
	await creditPage.fillDamagedFields(validDamagedItemFields(), {
		uploadImage: false,
		omit: ['qty', 'uom'],
	});
	await expect(creditPage.submitButton.first()).toBeEnabled();
}

async function submitAndShowPhotoError(page: Page, creditPage: CreditRequestsPage): Promise<void> {
	await creditPage.submitCreditRequest();
	await expectPhotoCountValidation(page);
}

test.describe('RCSP-27 - Credit Request photo validation', () => {
	test.setTimeout(120000);

	test('TC_RCSP-27_01 - eligible completed PO can start a credit request', { tag: ['@smoke', '@functional'] }, async ({ page }) => {
		const { creditPage, poNumber } = await startCreditRequest(page);
		await expect(creditPage.damagedItemsHeading).toBeVisible();
		await expect(page.getByText(new RegExp(poNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first()).toBeVisible();
	});

	test('TC_RCSP-27_02 - damaged item fields are displayed', { tag: ['@functional'] }, async ({ page }) => {
		const { creditPage } = await startCreditRequest(page);
		await creditPage.verifyDamagedFieldsVisible([
			'Incident Type',
			'Qty',
			'UOM',
			'Can you use this product?',
			'enough good product',
			'Images',
			'Choose',
		]);
	});

	test('TC_RCSP-27_03 - submission with zero images is blocked', { tag: ['@functional'] }, async ({ page }) => {
		const { creditPage } = await startCreditRequest(page);
		await fillValidFields(page, creditPage);
		await submitAndShowPhotoError(page, creditPage);
	});

	test('TC_RCSP-27_04 - submission with one image is blocked', { tag: ['@functional'] }, async ({ page }) => {
		const { creditPage } = await startCreditRequest(page);
		await fillValidFields(page, creditPage);
		await uploadImageCount(page, 1);
		await submitAndShowPhotoError(page, creditPage);
	});

	test('TC_RCSP-27_05 - submission with two images is blocked', { tag: ['@functional'] }, async ({ page }) => {
		const { creditPage } = await startCreditRequest(page);
		await fillValidFields(page, creditPage);
		await uploadImageCount(page, 2);
		await submitAndShowPhotoError(page, creditPage);
	});

	test('TC_RCSP-27_06 - three images satisfy photo validation and show confirmation', { tag: ['@functional'] }, async ({ page }) => {
		const { creditPage } = await startCreditRequest(page);
		await fillValidFields(page, creditPage);
		await uploadImageCount(page, 3);
		await creditPage.submitCreditRequest();
		await expect(page.getByText(/^submit credit request$/i).last()).toBeVisible();
		await expect(page.getByText(/once submitted, it will be locked and can no longer be edited/i).last()).toBeVisible();
		await expect(page.getByRole('button', { name: /^cancel$/i }).last()).toBeVisible();
		await expect(page.getByRole('button', { name: /^submit$/i }).last()).toBeVisible();
		await page.getByRole('button', { name: /^cancel$/i }).last().click();
	});

	test('TC_RCSP-27_07 - submitting three-image credit request creates a Submitted list record', { tag: ['@functional'] }, async ({ page }) => {
		const { creditPage, poNumber } = await startCreditRequest(page);
		await fillValidFields(page, creditPage);
		await uploadImageCount(page, 3);
		await creditPage.submitCreditRequest();
		await expect(page.getByText(/^submit credit request$/i).last()).toBeVisible();
		await expect(page.getByRole('button', { name: /^submit$/i }).last()).toBeVisible();
		await page.getByRole('button', { name: /^submit$/i }).last().click();
		await page.waitForLoadState('networkidle').catch(() => undefined);
		await creditPage.verifyCreditRequestsPageLoaded();
		const recordRow = page.getByRole('row')
			.filter({ hasText: new RegExp(poNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
			.first();
		await expect(recordRow).toBeVisible({ timeout: 20000 });
		await expect(recordRow).toContainText(/submitted/i);
	});
});
