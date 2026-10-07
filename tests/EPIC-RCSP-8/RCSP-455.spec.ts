import { test, expect } from '../../fixtures/baseTest';
import type { Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { getScenarioTestCaseData } from '../../utils/testData';
import { Reporting } from '../../reporting/Reporting';
import type {
	ApprovedPurchaseOrderTruckData,
} from '../../test-data/TestDataRepository';

const FILE_NAME = 'RCSP-455';
const SCENARIO_ID = 'RCSP-455';
const STORE_ID = 37;

const TC = {
	singlePoTruckDetails: 'TC_RCSP-455_01',
	multiplePoTruckDetails: 'TC_RCSP-455_02',
	lineIdentifiers: 'TC_RCSP-455_03',
	invalidPoId: 'TC_RCSP-455_04',
} as const;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function useCase(id: string): void {
	getScenarioTestCaseData<Record<string, never>>(FILE_NAME, SCENARIO_ID, id);
}

async function login(page: Page): Promise<void> {
	const loginPage = new RTCDashboardLoginPage(page);
	await page.goto(CONFIG.dashboardURL, {
		waitUntil: 'domcontentloaded',
		timeout: 30_000,
	});
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
}

function findNestedProperty(value: unknown, propertyName: string): unknown {
	if (!isRecord(value)) return undefined;
	if (Object.prototype.hasOwnProperty.call(value, propertyName)) return value[propertyName];
	for (const nestedValue of Object.values(value)) {
		if (isRecord(nestedValue)) {
			const found = findNestedProperty(nestedValue, propertyName);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

function getTruckDeliveries(body: unknown): JsonRecord[] {
	const value = findNestedProperty(body, 'truck_deliveries');
	if (Array.isArray(value)) return value.filter(isRecord);
	return isRecord(value) ? [value] : [];
}

function findLineItems(value: unknown): JsonRecord[] {
	if (!isRecord(value)) return [];
	const preferredKeys = [
		'line_items',
		'purchase_order_lines',
		'po_lines',
		'items',
		'lines',
	];
	for (const key of preferredKeys) {
		const candidate = findNestedProperty(value, key);
		if (Array.isArray(candidate) && candidate.some(isRecord)) {
			return candidate.filter(isRecord);
		}
	}
	for (const nestedValue of Object.values(value)) {
		if (Array.isArray(nestedValue)) {
			const lines = nestedValue.filter(
				(item): item is JsonRecord =>
					isRecord(item) && ('line_id' in item || 'po_line_id' in item),
			);
			if (lines.length > 0) return lines;
		}
		if (isRecord(nestedValue)) {
			const lines = findLineItems(nestedValue);
			if (lines.length > 0) return lines;
		}
	}
	return [];
}

function apiUrl(poId: number | string): string {
	return new URL(`/api/v1/purchase-orders/${encodeURIComponent(String(poId))}`, CONFIG.baseURL).toString();
}

async function getPurchaseOrderResponse(page: Page, poId: number): Promise<unknown> {
	const response = await authenticatedGet(page, apiUrl(poId));
	expect(response.status(), `GET purchase order ${poId}`).toBe(200);
	return response.json();
}

async function authenticatedGet(page: Page, url: string) {
	const token = await page.evaluate(() => {
		const browser = globalThis as unknown as {
			localStorage: { getItem(key: string): string | null };
		};
		return browser.localStorage.getItem('token');
	});
	const authorization = token
		? token.startsWith('Bearer ')
			? token
			: `Bearer ${token}`
		: undefined;
	for (let attempt = 1; attempt <= 2; attempt += 1) {
		try {
			return await page.context().request.get(url, {
				headers: authorization ? { Authorization: authorization } : {},
				timeout: 45_000,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const transientNetworkError = /timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED/i.test(message);
			if (!transientNetworkError || attempt === 2) {
				throw new Error(`Purchase Order API GET failed after ${attempt} attempt(s) due to a network error.`);
			}
			Reporting.info('Purchase Order API GET timed out; retrying once.');
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	throw new Error('Purchase Order API GET failed after retries.');
}

function expectTruckDelivery(body: unknown, poId: number): JsonRecord {
	const deliveries = getTruckDeliveries(body);
	expect(deliveries.length, `PO ${poId} should return truck_deliveries`).toBeGreaterThan(0);
	return deliveries[0];
}

function verifyDeliveryFields(delivery: JsonRecord): void {
	for (const field of ['delivery_id', 'invoice_number', 'arrived_at', 'status']) {
		expect(
			Object.prototype.hasOwnProperty.call(delivery, field),
			`Truck delivery should contain ${field}`,
		).toBeTruthy();
	}
}

test.describe('RCSP-455 - Purchase Order API truck delivery details', () => {
	test.setTimeout(120_000);

	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test('TC_RCSP-455_01 - Approved PO API returns its truck delivery details', async ({
		page,
		testData,
	}) => {
		useCase(TC.singlePoTruckDetails);
		const purchaseOrders = await testData.getApprovedPurchaseOrdersWithTruckDeliveries(STORE_ID);
		test.skip(purchaseOrders.length === 0, `Store ${STORE_ID} has no approved PO with a truck delivery`);
		const expected = purchaseOrders[0];

		const responseBody = await getPurchaseOrderResponse(page, expected.po_id);
		const delivery = expectTruckDelivery(responseBody, expected.po_id);
		verifyDeliveryFields(delivery);
	});

	test('TC_RCSP-455_02 - Multiple approved POs return truck delivery attributes', async ({
		page,
		testData,
	}) => {
		useCase(TC.multiplePoTruckDetails);
		const allRows = await testData.getApprovedPurchaseOrdersWithTruckDeliveries(STORE_ID);
		const purchaseOrders = [...new Map(
			allRows.map((row) => [row.po_id, row]),
		).values()].slice(0, 5);
		expect(purchaseOrders.length, `Store ${STORE_ID} should have an approved PO with a truck delivery`).toBeGreaterThan(0);
		if (purchaseOrders.length < 2) {
			test.info().annotations.push({
				type: 'Coverage limitation',
				description: `Only ${purchaseOrders.length} distinct approved PO is available; cross-PO isolation was not exercised.`,
			});
		}

		for (const purchaseOrder of purchaseOrders) {
			const body = await getPurchaseOrderResponse(page, purchaseOrder.po_id);
			const delivery = expectTruckDelivery(body, purchaseOrder.po_id);
			verifyDeliveryFields(delivery);
		}
	});

	test('TC_RCSP-455_03 - PO API returns line identifier and truck delivery attributes', async ({
		page,
		testData,
	}) => {
		useCase(TC.lineIdentifiers);
		const purchaseOrders = await testData.getApprovedPurchaseOrdersWithTruckDeliveries(STORE_ID);
		test.skip(purchaseOrders.length === 0, `Store ${STORE_ID} has no approved PO with a truck delivery`);
		const expected = purchaseOrders[0];
		const databaseLines = await testData.getPurchaseOrderLinesByPoId(expected.po_id);
		test.skip(databaseLines.length === 0, `PO ${expected.po_id} has no line items`);

		const body = await getPurchaseOrderResponse(page, expected.po_id);
		const lineItems = findLineItems(body);
		expect(lineItems.length, `PO ${expected.po_id} should return line items`).toBeGreaterThan(0);
		const displayedIdentifierAttributes = ['line_id', 'po_line_id'].filter((field) =>
			lineItems.some((line) => Object.prototype.hasOwnProperty.call(line, field)),
		);
		expect(displayedIdentifierAttributes).toContain('line_id');

		const deliveries = getTruckDeliveries(body);
		expect(deliveries.length, 'Response should include truck_deliveries').toBeGreaterThan(0);
		verifyDeliveryFields(deliveries[0]);
	});

	test('TC_RCSP-455_04 - API rejects a non-existing purchase order ID', async ({
		page,
		testData,
	}) => {
		useCase(TC.invalidPoId);
		const purchaseOrders = await testData.getApprovedPurchaseOrdersWithTruckDeliveries(STORE_ID);
		test.skip(purchaseOrders.length === 0, `Store ${STORE_ID} has no valid PO to derive the invalid ID from`);
		const invalidPoId = await testData.getNextNonExistingPurchaseOrderId();
		expect(invalidPoId).not.toBe(purchaseOrders[0].po_id);

		const response = await authenticatedGet(page, apiUrl(invalidPoId));
		expect(response.status(), 'Invalid PO should return a client error').toBeGreaterThanOrEqual(400);
		expect(response.status(), 'Invalid PO should not be treated as a server failure').toBeLessThan(500);
		const responseText = await response.text();
		expect(responseText).not.toMatch(/truck_deliveries|po_line_id|line_id/i);
	});
});
