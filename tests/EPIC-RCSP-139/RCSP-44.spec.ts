/**
 * RCSP-44 – IMS-to-IMS Transfers (Approve / Reject) automation
 * Test case IDs use TC_RCSP-44_* format.
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp44CommonData,
  type Rcsp44JsonData,
} from '../../utils/testData';

const RCSP_44_FILE_NAME = 'RCSP-44';
const RCSP_44_SCENARIO_ID = 'RCSP-44';

const TC = {
  prerequisites: 'TC_RCSP-44_001',
  hierarchyLogin: 'TC_RCSP-44_002',
  transfersListingUi: 'TC_RCSP-44_003',
  inventoryBaselines: 'TC_RCSP-44_004',
  storeDropdownRules: 'TC_RCSP-44_005',
  reasonCodes: 'TC_RCSP-44_006',
  submitPending: 'TC_RCSP-44_007',
  rejectDeclined: 'TC_RCSP-44_008',
  approveCompleted: 'TC_RCSP-44_009',
  onHandDestPlus: 'TC_RCSP-44_010',
  transferInDashboard: 'TC_RCSP-44_011',
  onHandSourceMinus: 'TC_RCSP-44_012',
  transferOutDashboard: 'TC_RCSP-44_013',
  financialRecord: 'TC_RCSP-44_014',
  exportPrint: 'TC_RCSP-44_015',
  insufficientStock: 'TC_RCSP-44_016',
  decimalQuantity: 'TC_RCSP-44_017',
  sendingUnitOnly: 'TC_RCSP-44_018',
  rejectBlankReason: 'TC_RCSP-44_019',
  mandatoryFields: 'TC_RCSP-44_020',
  otherRequiresNotes: 'TC_RCSP-44_021',
  rejectModalNo: 'TC_RCSP-44_022',
  approveModalNo: 'TC_RCSP-44_023',
  completedLocked: 'TC_RCSP-44_024',
  declinedLocked: 'TC_RCSP-44_025',
  exactOnHandQty: 'TC_RCSP-44_026',
  visibilityAcrossStores: 'TC_RCSP-44_027',
  e2eReject: 'TC_RCSP-44_028',
  e2eApprove: 'TC_RCSP-44_029',
} as const;

type SharedState = {
  pendingTransferId: string;
  declinedTransferId: string;
  completedTransferId: string;
  visibilityTransferId: string;
  onHand1034Before: number;
  onHand1025Before: number;
};

function getCommonData(): Rcsp44CommonData {
  return getScenarioTestData<Rcsp44JsonData>(
    RCSP_44_FILE_NAME,
    RCSP_44_SCENARIO_ID,
  ).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_44_FILE_NAME,
    RCSP_44_SCENARIO_ID,
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
  pendingTransferId: '',
  declinedTransferId: '',
  completedTransferId: '',
  visibilityTransferId: '',
  onHand1034Before: 0,
  onHand1025Before: 0,
};

test.describe("RCSP-44 - Prerequisites: IMS-to-IMS data setup available before Approve/Reject suite", () => {
  test("Verify whether prerequisite IMS stores WB Unit 1034 and WB Unit 1025, hierarchy path, item LARGE BUNS 11201, and Transfers access are available", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{ stores: string[]; item: string }>(TC.prerequisites);

    await transfersPage.openMyHierarchy();
    await transfersPage.expandHierarchyPath(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.verifyStoresVisible(data.stores);
    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    await transfersPage.verifyItemBalanceVisible(data.item);
    await transfersPage.openTransfers();
    await transfersPage.verifyNewTransferButtonEnabled();
  });
});

test.describe("RCSP-44 - Login & My Hierarchy: Admin can set active store to WB Unit 1034", () => {
  test("Verify whether the admin user can launch QA Backoffice Dashboard, open My Hierarchy, and set active store to WB Unit 1034", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const data = getCaseData<{
      region: string;
      market: string;
      selectedStore: string;
      stores: string[];
    }>(TC.hierarchyLogin);

    await transfersPage.openMyHierarchy();
    await transfersPage.expandHierarchyPath(data.region, data.market, data.selectedStore);
    await transfersPage.verifyStoresVisible(data.stores);
    await transfersPage.switchStore(data.region, data.market, data.selectedStore);
    await transfersPage.verifyActiveStore(data.selectedStore);
  });
});

test.describe("RCSP-44 - Transfers Listing UI: NEW TRANSFER, status tabs, and column headers", () => {
  test("Verify whether the Transfers page on WB Unit 1034 displays NEW TRANSFER, status sections, and expected column headers", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const data = getCaseData<{ statusTabs: string[]; columnHeaders: string[] }>(
      TC.transfersListingUi,
    );

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.verifyNewTransferButtonEnabled();
    await transfersPage.verifyStatusTabs(data.statusTabs);
    await transfersPage.selectStatusTab('All');
    await transfersPage.verifyColumnHeaders(data.columnHeaders);
  });
});

test.describe("RCSP-44 - Inventory Baselines: ON HAND / FIFO COST on 1034 and 1025", () => {
  test("Verify whether ON HAND and FIFO COST for LARGE BUNS 11201 can be recorded as baselines on WB Unit 1034 and WB Unit 1025", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{ store1034: string; store1025: string; item: string }>(
      TC.inventoryBaselines,
    );

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
    shared.onHand1025Before = await transfersPage.getOnHandValue(data.item);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store1034,
    );
    await transfersPage.verifyActiveStore(data.store1034);
  });
});

test.describe("RCSP-44 - New Transfer Store Dropdown Rules (IMS context)", () => {
  test("Verify whether From Store lists only IMS stores and To Store allows IMS destination WB Unit 1025", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      nonImsStore: string;
    }>(TC.storeDropdownRules);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.verifyNewTransferFormVisible();
    await transfersPage.verifyFromStoreExcludesNonIms([data.nonImsStore]);
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.toStore);
  });
});

test.describe("RCSP-44 - Transfer Reason Codes on New Transfer", () => {
  test("Verify whether the Transfer Reason dropdown displays all valid reason codes", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const data = getCaseData<{ reasonCodes: string[] }>(TC.reasonCodes);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.verifyReasonCodes(data.reasonCodes);
  });
});

test.describe("RCSP-44 - IMS to IMS Submit lands in Pending", () => {
  test("Verify whether submitting IMS→IMS transfer From 1034 To 1025 for LARGE BUNS Qty 1 creates Pending status", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
      expectedStatus: string;
    }>(TC.submitPending);

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
    await transfersPage.verifyTransferStatus(shared.pendingTransferId, data.expectedStatus);
    await transfersPage.verifyTransferStores(
      shared.pendingTransferId,
      data.fromStore,
      data.toStore,
    );
  });
});

test.describe("RCSP-44 - Destination Reject → Declined on both stores", () => {
  test("Verify whether destination WB Unit 1025 can Reject Pending transfer to Declined and source also shows Declined", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      rejectionReason: string;
      expectedStatus: string;
      modalTitle: string;
      modalDescription: string;
      toStore: string;
      fromStore: string;
    }>(TC.rejectDeclined);

    expect(shared.pendingTransferId).toBeTruthy();

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.verifyPendingActionsVisible(shared.pendingTransferId);
    await transfersPage.clickRejectForTransfer(shared.pendingTransferId);
    await transfersPage.verifyRejectModalVisible(data.modalTitle, data.modalDescription);
    await transfersPage.confirmReject(data.rejectionReason);
    await transfersPage.verifyTransferStatus(shared.pendingTransferId, data.expectedStatus);
    shared.declinedTransferId = shared.pendingTransferId;

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.fromStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.verifyTransferStatus(shared.declinedTransferId, data.expectedStatus);
  });
});

test.describe("RCSP-44 - Destination Approve → Completed", () => {
  test("Verify whether a fresh Pending IMS→IMS transfer can be Approved on WB Unit 1025 to Completed", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
      expectedStatus: string;
      modalTitle: string;
      modalDescription: string;
    }>(TC.approveCompleted);

    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    shared.onHand1034Before = await transfersPage.getOnHandValue(data.item);
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    shared.onHand1025Before = await transfersPage.getOnHandValue(data.item);

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
    shared.pendingTransferId = await transfersPage.getLatestTransferId('Pending');

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickApproveForTransfer(shared.pendingTransferId);
    await transfersPage.verifyApproveModalVisible(data.modalTitle, data.modalDescription);
    await transfersPage.confirmApprove();
    await transfersPage.verifyTransferStatus(shared.pendingTransferId, data.expectedStatus);
    shared.completedTransferId = shared.pendingTransferId;
  });
});

test.describe("RCSP-44 - Destination ON HAND +1 after Approve", () => {
  test("Verify whether ON HAND for LARGE BUNS on WB Unit 1025 increments by 1 after Completed transfer", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      item: string;
      expectedOnHandChange: number;
    }>(TC.onHandDestPlus);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const current = await transfersPage.getOnHandValue(data.item);
    expect(current).toBe(shared.onHand1025Before + data.expectedOnHandChange);
  });
});

test.describe("RCSP-44 - Dashboard Transfer In on destination", () => {
  test("Verify whether Dashboard Recent Stock Movements shows Transfer In +1 on WB Unit 1025", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      movementType: string;
      item: string;
      qty: string;
    }>(TC.transferInDashboard);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store,
    );
    await transfersPage.openDashboard();
    await transfersPage.verifyRecentStockMovement({
      type: data.movementType,
      item: data.item,
      qty: data.qty,
    });
  });
});

test.describe("RCSP-44 - Source ON HAND -1 after Approve", () => {
  test("Verify whether ON HAND for LARGE BUNS on WB Unit 1034 decrements by 1 after Completed transfer", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      item: string;
      expectedOnHandChange: number;
    }>(TC.onHandSourceMinus);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const current = await transfersPage.getOnHandValue(data.item);
    expect(current).toBe(shared.onHand1034Before + data.expectedOnHandChange);
  });
});

test.describe("RCSP-44 - Dashboard Transfer Out on source", () => {
  test("Verify whether Dashboard Recent Stock Movements shows Transfer Out -1 on WB Unit 1034", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      movementType: string;
      item: string;
      qty: string;
    }>(TC.transferOutDashboard);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store,
    );
    await transfersPage.openDashboard();
    await transfersPage.verifyRecentStockMovement({
      type: data.movementType,
      item: data.item,
      qty: data.qty,
    });
  });
});

test.describe("RCSP-44 - Financial record on Completed transfer", () => {
  test("Verify whether completing an IMS→IMS transfer creates a financial record on transfer details", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    expect(shared.completedTransferId).toBeTruthy();

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    await transfersPage.openTransferById(shared.completedTransferId);
    await transfersPage.verifyFinancialRecordVisible();
    await transfersPage.verifyItemOnTransfer(common.item.nameOrSku, common.item.quantity);
  });
});

test.describe("RCSP-44 - Export / Print transfer receipt", () => {
  test("Verify whether Completed IMS→IMS transfer receipt is exportable/printable from transfer record and Dashboard", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      activeStore: string;
      movementType: string;
      item: string;
      qty: string;
    }>(TC.exportPrint);

    expect(shared.completedTransferId).toBeTruthy();
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.activeStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    await transfersPage.openTransferById(shared.completedTransferId);
    await transfersPage.exportTransferReceipt();
    await transfersPage.printTransferReceipt();

    await transfersPage.openDashboard();
    await transfersPage.verifyRecentStockMovement({
      type: data.movementType,
      item: data.item,
      qty: data.qty,
    });
    await transfersPage.exportTransferReceipt();
    await transfersPage.printTransferReceipt();
  });
});

test.describe("RCSP-44 - Insufficient stock blocks submit", () => {
  test("Verify whether Qty exceeding ON HAND blocks IMS→IMS SUBMIT TRANSFER", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      item: string;
      fromStore: string;
      toStore: string;
    }>(TC.insufficientStock);

    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const onHand = await transfersPage.getOnHandValue(data.item);
    const excessQty = String(Math.floor(onHand) + 1);

    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.fillNotes(common.transfer.notes);
    await transfersPage.addItem(data.item, excessQty, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible(
      /insufficient|not enough|exceed|on hand|stock/i,
    );
  });
});

test.describe("RCSP-44 - Decimal quantity not allowed", () => {
  test("Verify whether decimal Qty to Order is rejected on New Transfer", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      item: string;
      invalidQuantity: string;
      validQuantity: string;
    }>(TC.decimalQuantity);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(common.hierarchy.sourceStore);
    await transfersPage.selectToStore(common.hierarchy.destinationStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(data.item, data.invalidQuantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible(/whole|integer|decimal|invalid|quantity/i);
  });
});

test.describe("RCSP-44 - Transfer initiation by sending unit only", () => {
  test("Verify whether transfer cannot be initiated on behalf of another unit from destination store", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      activeStore: string;
      attemptedFromStore: string;
      toStore: string;
    }>(TC.sendingUnitOnly);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.activeStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    const canSelectForeignFrom = await transfersPage.isFromStoreSelectable(
      data.attemptedFromStore,
    );
    if (canSelectForeignFrom) {
      await transfersPage.selectToStore(data.toStore);
      await transfersPage.selectTransferReason(common.transfer.reason);
      await transfersPage.addItem(
        common.item.nameOrSku,
        common.item.quantity,
        common.item.sku,
      );
      await transfersPage.submitTransfer().catch(() => undefined);
      await transfersPage.verifyValidationVisible(
        /sending|only|not allowed|cannot|restricted|invalid/i,
      );
    } else {
      expect(canSelectForeignFrom).toBeFalsy();
    }
  });
});

test.describe("RCSP-44 - Reject modal Reason mandatory", () => {
  test("Verify whether blank Reason on Reject modal keeps transfer Pending", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.rejectBlankReason);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: common.hierarchy.sourceStore,
      toStore: common.hierarchy.destinationStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: common.item.nameOrSku,
      quantity: common.item.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    const transferId = await transfersPage.getLatestTransferId('Pending');

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickRejectForTransfer(transferId);
    await transfersPage.verifyRejectModalVisible();
    await transfersPage.modalYesButton.click();
    await transfersPage.verifyValidationVisible();
    await transfersPage.dismissModal().catch(async () => {
      await transfersPage.modalNoButton.click().catch(() => undefined);
    });
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);

    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.confirmApprove();
  });
});

test.describe("RCSP-44 - Mandatory field consolidation on New Transfer", () => {
  test("Verify whether SUBMIT is blocked when To Store, Reason, items, or Qty are missing/invalid", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
    }>(TC.mandatoryFields);

    await ensureSourceStore(transfersPage);
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

test.describe("RCSP-44 - Other reason requires Notes", () => {
  test("Verify whether Transfer Reason Other requires Notes before submit", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{ reason: string; filledNotes: string }>(
      TC.otherRequiresNotes,
    );

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(common.hierarchy.sourceStore);
    await transfersPage.selectToStore(common.hierarchy.destinationStore);
    await transfersPage.selectTransferReason(data.reason);
    await transfersPage.fillNotes('');
    await transfersPage.addItem(
      common.item.nameOrSku,
      common.item.quantity,
      common.item.sku,
    );
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible(/comment|notes|required|mandatory/i);
    await transfersPage.fillNotes(data.filledNotes);
    await transfersPage.submitTransfer();
    await transfersPage.openTransfers();
    const transferId = await transfersPage.getLatestTransferId();
    await transfersPage.verifyTransferStatus(transferId, 'Pending');

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.confirmApprove();
  });
});

test.describe("RCSP-44 - Reject modal NO keeps Pending", () => {
  test("Verify whether clicking NO on Reject modal leaves transfer Pending", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.rejectModalNo);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: common.hierarchy.sourceStore,
      toStore: common.hierarchy.destinationStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: common.item.nameOrSku,
      quantity: common.item.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    const transferId = await transfersPage.getLatestTransferId();

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickRejectForTransfer(transferId);
    await transfersPage.reasonInput.fill(common.transfer.rejectionReason);
    await transfersPage.dismissModal();
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);
    await transfersPage.verifyPendingActionsVisible(transferId);

    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.confirmApprove();
  });
});

test.describe("RCSP-44 - Approve modal NO keeps Pending", () => {
  test("Verify whether clicking NO on Approve modal leaves transfer Pending with no inventory movement", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.approveModalNo);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: common.hierarchy.sourceStore,
      toStore: common.hierarchy.destinationStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: common.item.nameOrSku,
      quantity: common.item.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    const transferId = await transfersPage.getLatestTransferId();

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.dismissModal();
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);
    await transfersPage.verifyPendingActionsVisible(transferId);

    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.confirmApprove();
  });
});

test.describe("RCSP-44 - Completed transfer locked from further actions", () => {
  test("Verify whether Completed IMS→IMS transfer cannot be Approved or Rejected again", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    expect(shared.completedTransferId).toBeTruthy();

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    await transfersPage.verifyTransferStatus(shared.completedTransferId, 'Completed');
    await transfersPage.verifyNoApproveRejectActions(shared.completedTransferId);
  });
});

test.describe("RCSP-44 - Declined transfer locked from Approve", () => {
  test("Verify whether Declined IMS→IMS transfer cannot be Approved later", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    expect(shared.declinedTransferId).toBeTruthy();

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Declined');
    await transfersPage.verifyTransferStatus(shared.declinedTransferId, 'Declined');
    await transfersPage.verifyNoApproveRejectActions(shared.declinedTransferId);
  });
});

test.describe("RCSP-44 - Exact ON HAND quantity allowed (boundary)", () => {
  test("Verify whether Qty exactly equal to ON HAND submits to Pending without insufficient-stock error", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      expectedStatus: string;
    }>(TC.exactOnHandQty);

    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const exact = Math.floor(await transfersPage.getOnHandValue(data.item));
    test.skip(exact < 1, 'ON HAND < 1 – cannot exercise exact-qty boundary');

    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: data.fromStore,
      toStore: data.toStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: data.item,
      quantity: String(exact),
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    const transferId = await transfersPage.getLatestTransferId('Pending');
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);

    // Clean up: reject so inventory is not zeroed by a later approve
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickRejectForTransfer(transferId);
    await transfersPage.confirmReject(common.transfer.rejectionReason);
  });
});

test.describe("RCSP-44 - Same Transfer ID visibility across stores", () => {
  test("Verify whether Transfer ID and status stay consistent on WB Unit 1034 and WB Unit 1025", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
    }>(TC.visibilityAcrossStores);

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
    shared.visibilityTransferId = await transfersPage.getLatestTransferId('Pending');
    await transfersPage.verifyTransferStatus(shared.visibilityTransferId, 'Pending');

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.verifyTransferStatus(shared.visibilityTransferId, 'Pending');
    await transfersPage.verifyPendingActionsVisible(shared.visibilityTransferId);
    await transfersPage.clickApproveForTransfer(shared.visibilityTransferId);
    await transfersPage.confirmApprove();
    await transfersPage.verifyTransferStatus(shared.visibilityTransferId, 'Completed');

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.verifyTransferStatus(shared.visibilityTransferId, 'Completed');
  });
});

test.describe("RCSP-44 - End-to-End IMS to IMS Reject Flow", () => {
  test("Verify whether full reject flow ends in Declined on both stores with no inventory movement", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
      rejectionReason: string;
      expectedStatus: string;
    }>(TC.e2eReject);

    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const before1034 = await transfersPage.getOnHandValue(data.item);
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const before1025 = await transfersPage.getOnHandValue(data.item);

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
    const transferId = await transfersPage.getLatestTransferId('Pending');

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickRejectForTransfer(transferId);
    await transfersPage.confirmReject(data.rejectionReason);
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);

    await ensureSourceStore(transfersPage);
    await transfersPage.openTransfers();
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    expect(await transfersPage.getOnHandValue(data.item)).toBe(before1034);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    expect(await transfersPage.getOnHandValue(data.item)).toBe(before1025);
  });
});

test.describe("RCSP-44 - End-to-End IMS to IMS Approve Flow With Inventory & Dashboard", () => {
  test("Verify whether full approve flow updates status, inventory, dashboard, financial record, and export", async ({ page }) => {
    const { transfersPage } = await loginAsAdmin(page);
    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
      statusFlow: string[];
    }>(TC.e2eApprove);

    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const before1034 = await transfersPage.getOnHandValue(data.item);
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const before1025 = await transfersPage.getOnHandValue(data.item);

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
    const transferId = await transfersPage.getLatestTransferId();
    await transfersPage.verifyTransferStatus(transferId, data.statusFlow[0]);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.confirmApprove();
    await transfersPage.verifyTransferStatus(transferId, data.statusFlow[1]);

    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    expect(await transfersPage.getOnHandValue(data.item)).toBe(before1025 + 1);
    await transfersPage.openDashboard();
    await transfersPage.verifyRecentStockMovement({
      type: 'Transfer In',
      item: data.item,
      qty: '+1',
    });

    await ensureSourceStore(transfersPage);
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    expect(await transfersPage.getOnHandValue(data.item)).toBe(before1034 - 1);
    await transfersPage.openDashboard();
    await transfersPage.verifyRecentStockMovement({
      type: 'Transfer Out',
      item: data.item,
      qty: '-1',
    });

    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Completed');
    await transfersPage.openTransferById(transferId);
    await transfersPage.verifyFinancialRecordVisible();
    await transfersPage.exportTransferReceipt();
    await transfersPage.printTransferReceipt();
  });
});
