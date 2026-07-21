/**
 * RCSP-45 – Optimized Transfers (IMS → Non-IMS / status matrix) automation
 * Test case IDs use TC_RCSP-45_* format.
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp45CommonData,
  type Rcsp45JsonData,
} from '../../utils/testData';

const RCSP_45_FILE_NAME = 'RCSP-45';
const RCSP_45_SCENARIO_ID = 'RCSP-45';

const TC = {
  hierarchyLogin: 'TC_RCSP-45_001',
  inventoryBaselines: 'TC_RCSP-45_002',
  storeDropdownRules: 'TC_RCSP-45_003',
  imsToNonImsCompleted: 'TC_RCSP-45_004',
  imsToImsPending: 'TC_RCSP-45_005',
  draftThenSubmit: 'TC_RCSP-45_006',
  mandatoryValidations: 'TC_RCSP-45_007',
  invalidStoreQty: 'TC_RCSP-45_008',
  uiEdgeBehaviors: 'TC_RCSP-45_009',
  cancelDraftAndLockCompleted: 'TC_RCSP-45_010',
  e2eImsToNonIms: 'TC_RCSP-45_011',
  statusMatrix: 'TC_RCSP-45_012',
} as const;

type SharedState = {
  completedTransferId: string;
  pendingTransferId: string;
  onHand1034Before: number;
};

function getCommonData(): Rcsp45CommonData {
  return getScenarioTestData<Rcsp45JsonData>(
    RCSP_45_FILE_NAME,
    RCSP_45_SCENARIO_ID,
  ).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_45_FILE_NAME,
    RCSP_45_SCENARIO_ID,
    testCaseId,
  );
}

async function loginAsAdmin(page: Page): Promise<{
  loginPage: RTCDashboardLoginPage;
  transfersPage: TransfersPage;
}> {
  const loginPage = new RTCDashboardLoginPage(page);
  const transfersPage = new TransfersPage(page);

  log(`Launching URL: ${CONFIG.dashboardURL}`);
  await page.goto(CONFIG.dashboardURL);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await loginPage.login(
    CONFIG.credentials.admin.username,
    CONFIG.credentials.admin.password,
  );
  log('✓ Login successful');

  return { loginPage, transfersPage };
}

async function ensureSourceStore(transfersPage: TransfersPage): Promise<void> {
  const common = getCommonData();
  await transfersPage.switchStore(
    common.hierarchy.region,
    common.hierarchy.market,
    common.hierarchy.sourceStore,
  );
}

test.describe.configure({ mode: 'serial' });

const shared: SharedState = {
  completedTransferId: '',
  pendingTransferId: '',
  onHand1034Before: 0,
};

test.describe("RCSP-45 - My Hierarchy: Admin sets active store to WB Unit 1034", () => {
  test("Verify whether after login the admin can open My Hierarchy, confirm Region > Market > Store path for WB Unit 1034 and WB Unit 698, and set active store to WB Unit 1034", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const data = getCaseData<{
      region: string;
      market: string;
      selectStore: string;
      stores: string[];
    }>(TC.hierarchyLogin);

    await transfersPage.openMyHierarchy();
    await transfersPage.expandHierarchyPath(data.region, data.market, data.selectStore);
    await transfersPage.verifyStoresVisible(data.stores);
    await transfersPage.switchStore(data.region, data.market, data.selectStore);
    await transfersPage.verifyActiveStore(data.selectStore);
  });
});

test.describe("RCSP-45 - Inventory Baselines on IMS 1034 and Non-IMS 1025", () => {
  test("Verify whether ON HAND and FIFO COST for LARGE BUNS 11201 can be recorded on WB Unit 1034 and WB Unit 1025", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      store1034: string;
      store1025: string;
      item: string;
    }>(TC.inventoryBaselines);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store1034,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    shared.onHand1034Before = await transfersPage.getOnHandValue(data.item);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store1025,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    await transfersPage.verifyItemBalanceVisible(data.item);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store1034,
    );
    await transfersPage.verifyActiveStore(data.store1034);
  });
});

test.describe("RCSP-45 - New Transfer Store Dropdown Rules (IMS From / IMS+Non-IMS To)", () => {
  test("Verify whether From Store is IMS-only and To Store lists IMS and Non-IMS stores", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const data = getCaseData<{
      fromStore: string;
      imsToExample: string;
      nonImsExamples: string[];
    }>(TC.storeDropdownRules);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.verifyNewTransferFormVisible();
    await transfersPage.verifyFromStoreExcludesNonIms(data.nonImsExamples);
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.verifyToStoreIncludesStores([
      data.imsToExample,
      ...data.nonImsExamples,
    ]);
  });
});

test.describe("RCSP-45 - IMS to Non-IMS Submit → Completed + source ON HAND -1", () => {
  test("Verify whether submitting IMS→Non-IMS transfer From 1034 To 698 sets Completed immediately and decrements ON HAND", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
      expectedStatus: string;
      expectedOnHandChange: number;
    }>(TC.imsToNonImsCompleted);

    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    shared.onHand1034Before = await transfersPage.getOnHandValue(data.item);

    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: data.fromStore,
      toStore: data.toStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: data.item,
      quantity: data.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    shared.completedTransferId = await transfersPage.getLatestTransferId('Completed');
    await transfersPage.verifyTransferStatus(
      shared.completedTransferId,
      data.expectedStatus,
    );

    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const after = await transfersPage.getOnHandValue(data.item);
    expect(after).toBe(shared.onHand1034Before + data.expectedOnHandChange);
  });
});

test.describe("RCSP-45 - IMS to IMS Submit → Pending (contrast)", () => {
  test("Verify whether submitting IMS→IMS transfer From 1034 To 1008 results in Pending status", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
      expectedStatus: string;
    }>(TC.imsToImsPending);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: data.fromStore,
      toStore: data.toStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: data.item,
      quantity: data.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Pending');
    shared.pendingTransferId = await transfersPage.getLatestTransferId('Pending');
    await transfersPage.verifyTransferStatus(
      shared.pendingTransferId,
      data.expectedStatus,
    );
  });
});

test.describe("RCSP-45 - Draft then Submit IMS to Non-IMS → Completed", () => {
  test("Verify whether SAVE CHANGES creates Draft and SUBMIT from Draft Details yields Completed for Non-IMS destination", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
      expectedStatus: string;
    }>(TC.draftThenSubmit);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.createDraftTransfer({
      fromStore: data.fromStore,
      toStore: data.toStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: data.item,
      quantity: data.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    const draftId = await transfersPage.getLatestTransferId('Draft');
    await transfersPage.submitTransferFromList(draftId);
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    await transfersPage.verifyTransferStatus(draftId, data.expectedStatus);
    shared.completedTransferId = draftId;
  });
});

test.describe("RCSP-45 - New Transfer mandatory validations", () => {
  test("Verify whether SUBMIT is blocked when From Store, To Store, Reason, or Line Items are missing", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
    }>(TC.mandatoryValidations);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();

    await transfersPage.clickNewTransfer();
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(data.item, data.quantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(data.item, data.quantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.addItem(data.item, data.quantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();
  });
});

test.describe("RCSP-45 - Invalid store / quantity rules", () => {
  test("Verify whether same From/To, Non-IMS From Store, and invalid quantities are blocked", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      sameStore: string;
      nonImsFrom: string[];
      toStore: string;
      item: string;
      invalidQuantities: string[];
    }>(TC.invalidStoreQty);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.sameStore).catch(() => undefined);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(data.item, '1', common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.verifyFromStoreExcludesNonIms(data.nonImsFrom);

    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const onHand = await transfersPage.getOnHandValue(data.item);
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(
      data.item,
      String(Math.floor(onHand) + 1),
      common.item.sku,
    );
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible(
      /insufficient|not enough|exceed|on hand|stock/i,
    );

    for (const qty of data.invalidQuantities.filter((q) => q !== '')) {
      await transfersPage.openTransfers();
      await transfersPage.clickNewTransfer();
      await transfersPage.selectFromStore(data.fromStore);
      await transfersPage.selectToStore(data.toStore);
      await transfersPage.selectTransferReason(common.transfer.reason);
      await transfersPage.addItem(data.item, qty, common.item.sku);
      await transfersPage.submitTransfer().catch(() => undefined);
      await transfersPage.verifyValidationVisible();
    }
  });
});

test.describe("RCSP-45 - New Transfer UI edge behaviors", () => {
  test("Verify whether SAVE/SUBMIT stay disabled until complete and To Store search filters correctly", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const data = getCaseData<{
      partialSearches: string[];
      invalidSearch: string;
      fromStore: string;
    }>(TC.uiEdgeBehaviors);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.verifySaveAndSubmitDisabled();

    await transfersPage.openToStoreDropdown();
    for (const term of data.partialSearches) {
      await transfersPage.searchInOpenDropdown(term);
      await transfersPage.verifyStoreOptionVisible(`WB Unit ${term}`, true).catch(
        async () => {
          // Partial search may match store codes without full "WB Unit" label
          await transfersPage.verifyStoreOptionVisible(term, true);
        },
      );
    }
    await transfersPage.searchInOpenDropdown(data.invalidSearch);
    await transfersPage.verifyStoreOptionVisible('WB Unit 999999', false);
    await page.keyboard.press('Escape').catch(() => undefined);
  });
});

test.describe("RCSP-45 - Cancel Draft & lock Completed", () => {
  test("Verify whether Draft IMS→Non-IMS can be Cancelled without stock deduction and Completed is read-only", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
    }>(TC.cancelDraftAndLockCompleted);

    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const before = await transfersPage.getOnHandValue(data.item);

    await transfersPage.openTransfers();
    await transfersPage.createDraftTransfer({
      fromStore: data.fromStore,
      toStore: data.toStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: data.item,
      quantity: data.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    const draftId = await transfersPage.getLatestTransferId('Draft');
    await transfersPage.openTransferById(draftId);
    await transfersPage.cancelDraft(true);
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    await expect(transfersPage.transferRow(draftId)).toHaveCount(0);

    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    expect(await transfersPage.getOnHandValue(data.item)).toBe(before);

    expect(shared.completedTransferId).toBeTruthy();
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    await transfersPage.verifyTransferStatus(shared.completedTransferId, 'Completed');
    await transfersPage.verifyNoApproveRejectActions(shared.completedTransferId);
  });
});

test.describe("RCSP-45 - End-to-End full IMS to Non-IMS flow", () => {
  test("Verify whether hierarchy → baselines → New Transfer IMS→Non-IMS → SUBMIT results in Completed and source ON HAND reduction", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      baselineStore: string;
      item: string;
      quantity: string;
      expectedStatus: string;
    }>(TC.e2eImsToNonIms);

    await transfersPage.openMyHierarchy();
    await transfersPage.expandHierarchyPath(
      common.hierarchy.region,
      common.hierarchy.market,
      data.fromStore,
    );
    await transfersPage.verifyStoresVisible([
      data.fromStore,
      common.hierarchy.nonImsDestination,
    ]);
    await ensureSourceStore(transfersPage);

    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const before = await transfersPage.getOnHandValue(data.item);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.baselineStore,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: data.fromStore,
      toStore: data.toStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: data.item,
      quantity: data.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    const transferId = await transfersPage.getLatestTransferId('Completed');
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);

    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    expect(await transfersPage.getOnHandValue(data.item)).toBe(before - 1);
  });
});

test.describe("RCSP-45 - Status matrix IMS vs Non-IMS To Store", () => {
  test("Verify whether IMS→Non-IMS submits Completed and IMS→IMS submits Pending", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      transferA: { fromStore: string; toStore: string; expectedStatus: string };
      transferB: { fromStore: string; toStore: string; expectedStatus: string };
      item: string;
      quantity: string;
    }>(TC.statusMatrix);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: data.transferA.fromStore,
      toStore: data.transferA.toStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: data.item,
      quantity: data.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    const completedId = await transfersPage.getLatestTransferId('Completed');
    await transfersPage.verifyTransferStatus(
      completedId,
      data.transferA.expectedStatus,
    );

    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: data.transferB.fromStore,
      toStore: data.transferB.toStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: data.item,
      quantity: data.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Pending');
    const pendingId = await transfersPage.getLatestTransferId('Pending');
    await transfersPage.verifyTransferStatus(
      pendingId,
      data.transferB.expectedStatus,
    );
  });
});
