/**
 * RCSP-31 - Transfers / New Transfer and IUT lifecycle
 * All runtime test inputs come from PostgreSQL; this spec does not read JSON test data.
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
	TestDataRepository,
	type StoreLookupData,
	type TransferReasonData,
	type WasteableIngredientData,
} from '../../test-data/TestDataRepository';

const SOURCE_STORE_NAME = 'WB Unit 1034';
const RECEIVER_STORE_NAME = 'WB Unit 1008';
const SOURCE_STORE_ID = 37;
const REGION_NAME = '1700 San Antonio 4126314';
const MARKET_NAME = '1708 E Central SA 4126393';
const QUANTITY = '1.1';
const repository = new TestDataRepository();

type TransferContext = {
	source: StoreLookupData;
	receiver: StoreLookupData;
	item: WasteableIngredientData;
	reason: TransferReasonData;
};

type SharedState = {
	draftId: string;
	submittedId: string;
	declinedId: string;
	completedId: string;
};

const shared: SharedState = {
	draftId: '',
	submittedId: '',
	declinedId: '',
	completedId: '',
};

async function getTransferContext(): Promise<TransferContext> {
	const [source, receiver, item, itemSku, reason] = await Promise.all([
		repository.getStoreByName(SOURCE_STORE_NAME),
		repository.getStoreByName(RECEIVER_STORE_NAME),
		repository.getTransferableZeroStockIngredientByStoreId(SOURCE_STORE_ID),
		repository.getTransferableZeroStockIngredientSkuByStoreId(SOURCE_STORE_ID),
		repository.getTransferReasonByCode('Demand'),
	]);

	expect(source, `Missing source store in DB: ${SOURCE_STORE_NAME}`).toBeDefined();
	expect(receiver, `Missing receiver store in DB: ${RECEIVER_STORE_NAME}`).toBeDefined();
	expect(item, `No transferable zero-stock ingredient for store ${SOURCE_STORE_ID}`).toBeDefined();
	expect(itemSku, `No transferable zero-stock SKU for store ${SOURCE_STORE_ID}`).toBeDefined();
	expect(reason, 'Missing active Demand transfer reason in DB').toBeDefined();
	expect(item!.sku).toBe(itemSku);

	return {
		source: source!,
		receiver: receiver!,
		item: { ...item!, sku: itemSku! },
		reason: reason!,
	};
}

async function loginAsAdmin(page: Page): Promise<TransfersPage> {
	const loginPage = new RTCDashboardLoginPage(page);
	const transfersPage = new TransfersPage(page);
	await page.goto(CONFIG.dashboardURL);
	await loginPage.login(CONFIG.credentials.admin.username, CONFIG.credentials.admin.password);
	return transfersPage;
}

async function openTransfersForStore(
	page: Page,
	transfersPage: TransfersPage,
	store: StoreLookupData,
): Promise<void> {
	await transfersPage.switchStore(REGION_NAME, MARKET_NAME, store.name);
	await transfersPage.verifyActiveStore(store.name);
	await transfersPage.openTransfers();
}

async function createDraft(
	page: Page,
	context: TransferContext,
): Promise<{ transfersPage: TransfersPage; transferId: string }> {
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.source);
	await transfersPage.clickNewTransfer();
	await transfersPage.verifyNewTransferFormVisible();
	await transfersPage.verifyFromStoreSelected(context.source.name);
	await transfersPage.selectToStore(context.receiver.name);
	await transfersPage.selectTransferReason(context.reason.description);
	await transfersPage.addItem(context.item.name, QUANTITY, context.item.sku);
	await transfersPage.saveChanges();
	await transfersPage.openTransfers();
	await transfersPage.selectStatusTab('Draft');
	const transferId = await transfersPage.getLatestTransferId('Draft');
	return { transfersPage, transferId };
}

async function createSubmittedTransfer(
	page: Page,
	context: TransferContext,
): Promise<string> {
	const { transfersPage, transferId } = await createDraft(page, context);
	await transfersPage.openTransferById(transferId);
	await transfersPage.submitTransfer();
	await transfersPage.openTransfers();
	await transfersPage.selectStatusTab('Pending');
	await transfersPage.verifyTransferStatus(transferId, 'Pending');
	return transferId;
}

test.describe.configure({ mode: 'serial' });

test('TC_RCSP-31_01 - create a DB-driven Draft IUT', async ({ page }) => {
	const context = await getTransferContext();
	const { transfersPage, transferId } = await createDraft(page, context);
	shared.draftId = transferId;

	await transfersPage.verifyTransferStatus(transferId, 'Draft');
	await transfersPage.verifyTransferStores(transferId, context.source.name, context.receiver.name);
	await transfersPage.verifyTransferStatus(transferId, 'Draft');
});

test('TC_RCSP-31_02 - validate missing mandatory fields and invalid quantity', async ({ page }) => {
	const context = await getTransferContext();
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.source);
	await transfersPage.clickNewTransfer();
	await transfersPage.verifyNewTransferFormVisible();
	await transfersPage.addItem(context.item.name, '0', context.item.sku);
	await transfersPage.submitTransfer().catch(() => undefined);
	await transfersPage.verifyValidationVisible();
});

test('TC_RCSP-31_03 - verify Draft details and actions', async ({ page }) => {
	const context = await getTransferContext();
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.source);
	await transfersPage.selectStatusTab('Draft');
	await transfersPage.openTransferById(shared.draftId);
	await transfersPage.verifyTransferDetail({
		transferId: shared.draftId,
		fromStore: context.source.name,
		toStore: context.receiver.name,
		reason: context.reason.description,
		sku: context.item.sku,
		quantity: QUANTITY,
		status: 'Draft',
	});
	await transfersPage.verifyDraftDetailActionsVisible();
});

test('TC_RCSP-31_04 - submit the Draft IUT and verify Pending status', async ({ page }) => {
	const context = await getTransferContext();
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.source);
	await transfersPage.selectStatusTab('Draft');
	await transfersPage.openTransferById(shared.draftId);
	await transfersPage.submitTransfer();
	await transfersPage.openTransfers();
	await transfersPage.selectStatusTab('Pending');
	await transfersPage.verifyTransferStatus(shared.draftId, 'Pending');
	shared.submittedId = shared.draftId;
});

test('TC_RCSP-31_05 - block submission when required data is invalid', async ({ page }) => {
	const context = await getTransferContext();
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.source);
	await transfersPage.clickNewTransfer();
	await transfersPage.verifyNewTransferFormVisible();
	await transfersPage.submitTransfer().catch(() => undefined);
	await transfersPage.verifyValidationVisible();
});

test('TC_RCSP-31_06 - receiving store sees submitted IUT as read-only', async ({ page }) => {
	const context = await getTransferContext();
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.receiver);
	await transfersPage.selectStatusTab('Pending');
	await transfersPage.openTransferById(shared.submittedId);
	await transfersPage.verifyTransferDetail({
		transferId: shared.submittedId,
		fromStore: context.source.name,
		toStore: context.receiver.name,
		sku: context.item.sku,
		quantity: QUANTITY,
		status: 'Pending',
	});
	await transfersPage.verifySubmittedReadOnly();
});

test('TC_RCSP-31_07 - receiving store can accept and reject submitted IUTs', async ({ page }) => {
	const context = await getTransferContext();
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.receiver);
	await transfersPage.selectStatusTab('Pending');
	await transfersPage.clickAcceptForTransfer(shared.submittedId);
	await transfersPage.verifyApproveModalVisible();
	await transfersPage.confirmApprove();
	await transfersPage.openTransfers();
	await transfersPage.selectStatusTab('Completed');
	await transfersPage.verifyTransferStatus(shared.submittedId, 'Completed');
	shared.completedId = shared.submittedId;

	const rejectedId = await createSubmittedTransfer(page, context);
	shared.declinedId = rejectedId;
	await transfersPage.switchStoreViaHeader(context.receiver.name);
	await transfersPage.verifyActiveStore(context.receiver.name);
	await transfersPage.openTransfers();
	await transfersPage.selectStatusTab('Pending');
	await transfersPage.clickRejectForTransfer(rejectedId);
	await transfersPage.verifyRejectModalVisible();
	await transfersPage.confirmReject('RCSP-31 rejection');
	await transfersPage.openTransfers();
	await transfersPage.selectStatusTab('Declined');
	await transfersPage.verifyTransferStatus(rejectedId, 'Declined');
	await transfersPage.verifyNoApproveRejectActions(rejectedId);
});

test('TC_RCSP-31_08 - completed IUT is terminal and ready for downstream processing', async ({ page }) => {
	const context = await getTransferContext();
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.receiver);
	await transfersPage.selectStatusTab('Completed');
	await transfersPage.openTransferById(shared.completedId);
	await transfersPage.verifyTransferDetail({
		transferId: shared.completedId,
		fromStore: context.source.name,
		toStore: context.receiver.name,
		sku: context.item.sku,
		quantity: QUANTITY,
		status: 'Completed',
	});
	await transfersPage.verifyTerminalTransferState('Completed');
});

test('TC_RCSP-31_09 - DB-driven lifecycle reaches completion without exposing financial details', async ({ page }) => {
	const context = await getTransferContext();
	const transferId = await createSubmittedTransfer(page, context);
	const transfersPage = await loginAsAdmin(page);
	await openTransfersForStore(page, transfersPage, context.receiver);
	await transfersPage.selectStatusTab('Pending');
	await transfersPage.clickAcceptForTransfer(transferId);
	await transfersPage.verifyApproveModalVisible();
	await transfersPage.confirmApprove();
	await transfersPage.openTransfers();
	await transfersPage.selectStatusTab('Completed');
	await transfersPage.verifyTransferStatus(transferId, 'Completed');
	await transfersPage.openTransferById(transferId);
	await expect(page.getByText(/financial posting|financial system|fifo cost/i)).toHaveCount(0);
});
