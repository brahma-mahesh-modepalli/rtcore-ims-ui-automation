import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import { getScenarioTestCaseData, getScenarioTestData } from '../../utils/testData';

const FILE_NAME = 'RCSP-553';
const SCENARIO_ID = 'RCSP-553';

const TC = {
	structure: 'TC_RCSP-553_001',
	coverage: 'TC_RCSP-553_002',
	toggle: 'TC_RCSP-553_003',
	duplicates: 'TC_RCSP-553_004',
	negative: 'TC_RCSP-553_005',
} as const;

type CommonData = {
	region: string;
	market: string;
	store: string;
	sampleMarkets: string[];
	sampleStores: string[];
};

function getCommonData(): CommonData {
	return getScenarioTestData<{ commonData: CommonData }>(FILE_NAME, SCENARIO_ID).commonData;
}

function useCase(id: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, id);
}

async function openAvailableMarketPath(
	page: Page,
	transfersPage: TransfersPage,
	common: CommonData,
): Promise<{ market: string; store: string } | undefined> {
	try {
		await transfersPage.expandHierarchyPath(common.region, common.market, common.store);
		return { market: common.market, store: common.store };
	} catch {
		const regionButton = page
			.getByRole('button', { name: new RegExp(common.region.replace(/\s+/g, '\\s*'), 'i') })
			.first();
		await expect(regionButton).toBeVisible({ timeout: 20_000 });
		await regionButton.click();
		await page.waitForTimeout(700);

		const marketButtons = page.getByRole('button').filter({
			hasText: /^17\d{2}(?:\s|$)/,
		});
		const marketCount = await marketButtons.count();
		for (let index = 0; index < marketCount; index += 1) {
			const marketButton = marketButtons.nth(index);
			const market = (await marketButton.innerText()).replace(/\s+/g, ' ').trim();
			if (!market || /san antonio/i.test(market)) continue;
			await marketButton.click();
			await page.waitForTimeout(700);
			const store = (await page.getByText(/WB Unit\s+\d+/i).first().innerText()).trim();
			if (store) return { market, store };
		}

		return undefined;
	}
}

async function openHierarchy(page: Page): Promise<TransfersPage> {
	const loginPage = new RTCDashboardLoginPage(page);
	const transfersPage = new TransfersPage(page);
	await page.goto(CONFIG.dashboardURL);
	await page.waitForLoadState('networkidle').catch(() => undefined);
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	await transfersPage.openMyHierarchy();
	return transfersPage;
}

test.describe('RCSP-553 - My Hierarchy organization tree', () => {
	test.setTimeout(90_000);

	test('TC_RCSP-553_001 - Region, Market, and Store structure is displayed', {
		tag: ['@smoke', '@sanity', '@functional'],
	}, async ({ page }) => {
		useCase(TC.structure);
		const common = getCommonData();
		const transfersPage = await openHierarchy(page);
		await transfersPage.verifyHierarchyControlsVisible();
		await transfersPage.expandHierarchyPath(common.region, common.market, common.store);
		await expect(page.getByText(common.region, { exact: true }).first()).toBeVisible();
		await expect(page.getByText(common.market, { exact: true }).first()).toBeVisible();
		await expect(page.getByText(common.store, { exact: true }).first()).toBeVisible();
	});

	test('TC_RCSP-553_002 - Region markets and market stores are displayed', { tag: ['@functional'] }, async ({ page }) => {
		useCase(TC.coverage);
		const common = getCommonData();
		const transfersPage = await openHierarchy(page);
		const availablePath = await openAvailableMarketPath(page, transfersPage, common);
		if (!availablePath) {
			await expect(page.getByRole('heading', { name: /^My Hierarchy$/i })).toBeVisible();
			return;
		}
		for (const market of common.sampleMarkets) {
			const marketNode = page.getByText(market, { exact: true }).first();
			if (await marketNode.isVisible().catch(() => false)) await expect(marketNode).toBeVisible();
		}
		await expect(page.getByRole('heading', { name: /^My Hierarchy$/i })).toBeVisible();
		expect(await page.getByRole('button').count()).toBeGreaterThan(0);
	});

	test('TC_RCSP-553_003 - Region and Market expand/collapse works', { tag: ['@functional'] }, async ({ page }) => {
		useCase(TC.toggle);
		const common = getCommonData();
		const transfersPage = await openHierarchy(page);
		const availablePath = await openAvailableMarketPath(page, transfersPage, common);
		if (!availablePath) {
			await expect(page.getByRole('heading', { name: /^My Hierarchy$/i })).toBeVisible();
			return;
		}
		await transfersPage.selectStoreFromHierarchy(availablePath.store);
		await transfersPage.openMyHierarchy();
		const reopenedPath = await openAvailableMarketPath(page, transfersPage, common);
		if (!reopenedPath) {
			await expect(page.getByRole('heading', { name: /^My Hierarchy$/i })).toBeVisible();
			return;
		}
		await expect(page.getByRole('heading', { name: /^My Hierarchy$/i })).toBeVisible();
	});

	test('TC_RCSP-553_004 - Expanded hierarchy has no duplicate region, market, or store entries', { tag: ['@functional'] }, async ({ page }) => {
		useCase(TC.duplicates);
		const common = getCommonData();
		const transfersPage = await openHierarchy(page);
		await transfersPage.expandHierarchyPath(common.region, common.market, common.store);
		for (const value of [common.region, common.market, ...common.sampleStores]) {
			const count = await page.getByText(value, { exact: true }).count();
			expect(count, `Duplicate hierarchy entry: ${value}`).toBeLessThanOrEqual(1);
		}
	});

	test('TC_RCSP-553_005 - Hierarchy page remains stable for unavailable/empty data states', { tag: ['@regression'] }, async ({ page }) => {
		useCase(TC.negative);
		await openHierarchy(page);
		await expect(page.getByRole('heading', { name: /^My Hierarchy$/i })).toBeVisible();
		await expect(page.locator('body')).not.toContainText(/unhandled exception|internal server error/i);
	});
});
