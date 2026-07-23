/**
 * RCSP-221 – Transfers end-to-end automation
 * Test case IDs use TC_RCSP-221_* format.
 */

import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp220CommonData,
  type Rcsp220JsonData,
} from '../../utils/testData';
import { getTransferData } from '../../database/tranferQueries';

const RCSP_221_FILE_NAME = 'RCSP-221';
const RCSP_221_SCENARIO_ID = 'RCSP-221';

const TC = {
  hierarchyOpen: 'TC_RCSP-221_001',
  hierarchySelect: 'TC_RCSP-221_002',
  storeContext1034: 'TC_RCSP-221_003',
  switchStore1025: 'TC_RCSP-221_004',
  openInventoryBalances: 'TC_RCSP-221_005',
  onHand1034: 'TC_RCSP-221_006',
  onHand1025: 'TC_RCSP-221_007',
  invalidInventorySearch: 'TC_RCSP-221_008',
  openTransfers: 'TC_RCSP-221_009',
  openNewTransferForm: 'TC_RCSP-221_010',
  createDraft: 'TC_RCSP-221_011',
  draftInAll: 'TC_RCSP-221_012',
  draftInDraftTab: 'TC_RCSP-221_013',
  draftDetailsActions: 'TC_RCSP-221_014',
  submitDraftToPending: 'TC_RCSP-221_015',
  pendingVisibleOn1025: 'TC_RCSP-221_016',
  rejectPending: 'TC_RCSP-221_017',
  rejectBlankReason: 'TC_RCSP-221_018',
  declinedOn1034: 'TC_RCSP-221_019',
  directSubmit: 'TC_RCSP-221_020',
  approvePending: 'TC_RCSP-221_021',
  onHandIncrement1025: 'TC_RCSP-221_022',
  transferInDashboard: 'TC_RCSP-221_023',
  onHandDecrement1034: 'TC_RCSP-221_024',
  transferOutDashboard: 'TC_RCSP-221_025',
  validationFromStore: 'TC_RCSP-221_026',
  validationToStore: 'TC_RCSP-221_027',
  validationReason: 'TC_RCSP-221_028',
  validationNoItems: 'TC_RCSP-221_029',
  validationZeroQty: 'TC_RCSP-221_030',
  validationSameStore: 'TC_RCSP-221_031',
  validationInsufficientStock: 'TC_RCSP-221_032',
  cancelDraft: 'TC_RCSP-221_033',
  rejectModalNo: 'TC_RCSP-221_034',
  approveModalNo: 'TC_RCSP-221_035',
  completedNoActions: 'TC_RCSP-221_036',
  declinedNoApprove: 'TC_RCSP-221_037',
  saveDraftChanges: 'TC_RCSP-221_038',
  transfersPageLayout: 'TC_RCSP-221_039',
  decimalQuantity: 'TC_RCSP-221_040',
  receivingCannotInitiate: 'TC_RCSP-221_041',
  reasonCodes: 'TC_RCSP-221_042',
  otherReasonRequiresNotes: 'TC_RCSP-221_043',
  endToEndApprove: 'TC_RCSP-221_044',
  financialRecord: 'TC_RCSP-221_045',
  exportPrintDetails: 'TC_RCSP-221_046',
  exportPrintDashboard: 'TC_RCSP-221_047',
} as const;

type SharedState = {
  draftTransferId: string;
  declinedTransferId: string;
  pendingTransferId: string;
  completedTransferId: string;
  onHand1034Before: number;
  onHand1025Before: number;
};

function getCommonData(): Rcsp220CommonData {
  return getScenarioTestData<Rcsp220JsonData>(
    RCSP_221_FILE_NAME,
    RCSP_221_SCENARIO_ID,
  ).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_221_FILE_NAME,
    RCSP_221_SCENARIO_ID,
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


test.describe.configure({ mode: 'serial' });


const shared: SharedState = {
  draftTransferId: '',
  declinedTransferId: '',
  pendingTransferId: '',
  completedTransferId: '',
  onHand1034Before: 0,
  onHand1025Before: 0,
};

test.describe("RCSP-221 - My Hierarchy: Logged-in admin user can open the My Hierarchy page from the main navigation menu", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the logged-in admin user can open the My Hierarchy page from the main navigation menu", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    getCaseData(TC.hierarchyOpen);
    await transfersPage.openMyHierarchy();
    await transfersPage.verifyHierarchyControlsVisible();

  });
});


test.describe("RCSP-221 - My Hierarchy: Admin user can select Region, Market, and Store from the My Hierarchy page and view sto...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can select Region, Market, and Store from the My Hierarchy page and view stores under the selected hierarchy path", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const data = getCaseData<{
      region: string;
      market: string;
      stores: string[];
      selectStore: string;
    }>(TC.hierarchySelect);

    await transfersPage.openMyHierarchy();
    await transfersPage.expandHierarchyPath(
      data.region,
      data.market,
      data.selectStore,
    );
    await transfersPage.verifyStoresVisible(data.stores);
    await transfersPage.selectStoreFromHierarchy(data.selectStore);

  });
});

test.describe("RCSP-221 - My Hierarchy: Currently selected store is displayed in the top-right corner of the Home page after se...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the currently selected store is displayed in the top-right corner of the Home page after selecting WB Unit 1034 from My Hierarchy", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ selectedStore: string }>(TC.storeContext1034);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.selectedStore,
    );
    await transfersPage.verifyActiveStore(data.selectedStore);

  });
});

test.describe("RCSP-221 - My Hierarchy: Admin user can switch the active store from WB Unit 1034 to WB Unit 1025 using the My H...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can switch the active store from WB Unit 1034 to WB Unit 1025 using the My Hierarchy page and the Home page reflects the change", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ fromStore: string; toStore: string }>(
      TC.switchStore1025,
    );

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.toStore,
    );
    await transfersPage.verifyActiveStore(data.toStore);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.fromStore,
    );
    await transfersPage.verifyActiveStore(data.fromStore);

  });
});

test.describe("RCSP-221 - Inventory Balances: Admin user can navigate to Inventory > Inventory Balances page from the main menu while...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can navigate to Inventory > Inventory Balances page from the main menu while WB Unit 1034 is selected", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.verifyInventoryColumnsVisible();

  });
});

test.describe("RCSP-221 - Inventory Balances: ON HAND quantity and FIFO COST values are displayed correctly for item LARGE BUNS 11201...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the ON HAND quantity and FIFO COST values are displayed correctly for item LARGE BUNS 11201 on WB Unit 1034 Inventory Balances page", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ store: string; item: string }>(TC.onHand1034);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    await transfersPage.verifyItemBalanceVisible(data.item);
    shared.onHand1034Before = await transfersPage.getOnHandValue(data.item);

  });
});

test.describe("RCSP-221 - Inventory Balances: ON HAND quantity and FIFO COST values are displayed correctly for item LARGE BUNS 11201...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the ON HAND quantity and FIFO COST values are displayed correctly for item LARGE BUNS 11201 on WB Unit 1025 Inventory Balances page", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ store: string; item: string }>(TC.onHand1025);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    await transfersPage.verifyItemBalanceVisible(data.item);
    shared.onHand1025Before = await transfersPage.getOnHandValue(data.item);

  });
});

test.describe("RCSP-221 - Inventory Balances: Inventory Balances page displays no records or an appropriate message when searching fo...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the Inventory Balances page displays no records or an appropriate message when searching for a non-existent item on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ store: string; item: string; emptyMessage: string }>(
      TC.invalidInventorySearch,
    );

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store,
    );
    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    await transfersPage.verifyNoInventoryRecords(data.emptyMessage);

  });
});

test.describe("RCSP-221 - Transfers: Admin user can navigate to the Transfers page from the main menu while WB Unit 1034 is...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can navigate to the Transfers page from the main menu while WB Unit 1034 is selected", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.verifyNewTransferButtonEnabled();

  });
});

test.describe("RCSP-221 - Transfers: Admin user can open the New Transfer form by clicking the NEW TRANSFER button on the Tr...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can open the New Transfer form by clicking the NEW TRANSFER button on the Transfers page", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.verifyNewTransferFormVisible();

  });
});

test.describe("RCSP-221 - Transfers: Admin user can create a new Transfer in Draft status by filling transfer header details...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can create a new Transfer in Draft status by filling transfer header details and adding item LARGE BUNS 11201 with quantity 1 on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      reason: string;
      notes: string;
      item: string;
      quantity: string;
      sku?: string;
    }>(TC.createDraft);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.fromStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.createDraftTransfer({
      ...data,
      sku: data.sku || common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    shared.draftTransferId = await transfersPage.getLatestTransferId('Draft');
    expect(shared.draftTransferId.length).toBeGreaterThan(0);
    await transfersPage.verifyTransferStatus(shared.draftTransferId, 'Draft');

  });
});

test.describe("RCSP-221 - Transfers: Recently created Transfer appears in the All section of the Transfers page with Draft s...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the recently created Transfer appears in the All section of the Transfers page with Draft status on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.draftInAll);
    expect(shared.draftTransferId).toBeTruthy();

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('All');
    await transfersPage.verifyTransferStatus(
      shared.draftTransferId,
      data.expectedStatus,
    );
    await transfersPage.verifyTransferStores(
      shared.draftTransferId,
      common.hierarchy.sourceStore,
      common.hierarchy.destinationStore,
    );

  });
});

test.describe("RCSP-221 - Transfers: Recently created Draft transfer is visible in the Draft section of the Transfers page o...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the recently created Draft transfer is visible in the Draft section of the Transfers page on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.draftInDraftTab);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    await transfersPage.verifyTransferStatus(
      shared.draftTransferId,
      data.expectedStatus,
    );

  });
});

test.describe("RCSP-221 - Transfers: Clicking a Draft transfer record opens the Draft Details page with CANCEL, SAVE CHANGES...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether clicking a Draft transfer record opens the Draft Details page with CANCEL, SAVE CHANGES, and SUBMIT TRANSFER action buttons on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    await transfersPage.openTransferById(shared.draftTransferId);
    await transfersPage.verifyItemOnTransfer(common.item.nameOrSku, common.item.quantity);
    await transfersPage.verifyDraftDetailActionsVisible();

  });
});

test.describe("RCSP-221 - Transfers: Admin user can submit a Draft transfer and the transfer status changes to Pending on WB...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can submit a Draft transfer and the transfer status changes to Pending on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.submitDraftToPending);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    await transfersPage.submitTransferFromList(shared.draftTransferId);
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('All');
    await transfersPage.verifyTransferStatus(
      shared.draftTransferId,
      data.expectedStatus,
    );
    shared.pendingTransferId = shared.draftTransferId;

  });
});

test.describe("RCSP-221 - Transfers: Pending transfer sent from WB Unit 1034 is visible on the Transfers page when viewed fr...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether a Pending transfer sent from WB Unit 1034 is visible on the Transfers page when viewed from WB Unit 1025 with Reject and Approve action buttons", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      expectedStatus: string;
    }>(TC.pendingVisibleOn1025);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.verifyTransferStatus(
      shared.pendingTransferId,
      data.expectedStatus,
    );
    await transfersPage.verifyTransferStores(
      shared.pendingTransferId,
      data.fromStore,
      data.toStore,
    );
    await transfersPage.verifyPendingActionsVisible(shared.pendingTransferId);

  });
});

test.describe("RCSP-221 - Transfers: Reject Transfer modal prevents rejection when the mandatory Reason field is left blank...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the Reject Transfer modal prevents rejection when the mandatory Reason field is left blank on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.rejectBlankReason);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickRejectForTransfer(shared.pendingTransferId);
    await transfersPage.verifyRejectModalVisible();
    await transfersPage.modalYesButton.click();
    await transfersPage.verifyValidationVisible();
    await transfersPage.dismissModal().catch(async () => {
      await transfersPage.modalNoButton.click().catch(() => undefined);
    });
    await transfersPage.verifyTransferStatus(
      shared.pendingTransferId,
      data.expectedStatus,
    );

  });
});

test.describe("RCSP-221 - Transfers: Destination store user can reject a Pending transfer with a reason and the transfer sta...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the destination store user can reject a Pending transfer with a reason and the transfer status changes to Declined on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      rejectionReason: string;
      expectedStatus: string;
      modalTitle: string;
      modalDescription: string;
    }>(TC.rejectPending);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickRejectForTransfer(shared.pendingTransferId);
    await transfersPage.verifyRejectModalVisible(
      data.modalTitle,
      data.modalDescription,
    );
    await transfersPage.confirmReject(data.rejectionReason);
    await transfersPage.verifyTransferStatus(
      shared.pendingTransferId,
      data.expectedStatus,
    );
    shared.declinedTransferId = shared.pendingTransferId;

  });
});

test.describe("RCSP-221 - Transfers: Declined transfer status is reflected on the Transfers page when viewed from the source...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether a Declined transfer status is reflected on the Transfers page when viewed from the source store WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.declinedOn1034);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.verifyTransferStatus(
      shared.declinedTransferId,
      data.expectedStatus,
    );

  });
});

test.describe("RCSP-221 - Transfers: Admin user can create and directly submit a new Transfer from WB Unit 1034 to WB Unit 1...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can create and directly submit a new Transfer from WB Unit 1034 to WB Unit 1025 without saving as Draft", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      reason?: string;
      notes?: string;
      item: string;
      quantity: string;
      expectedStatus: string;
    }>(TC.directSubmit);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.fromStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.createAndSubmitTransfer({
      fromStore: data.fromStore,
      toStore: data.toStore,
      reason: data.reason || common.transfer.reason,
      notes: data.notes || common.transfer.notes,
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

test.describe("RCSP-221 - Transfers: Destination store user can approve a Pending transfer and the transfer status changes t...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the destination store user can approve a Pending transfer and the transfer status changes to Completed on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      expectedStatus: string;
      modalTitle: string;
      modalDescription: string;
    }>(TC.approvePending);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.destinationStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickApproveForTransfer(shared.pendingTransferId);
    await transfersPage.verifyApproveModalVisible(
      data.modalTitle,
      data.modalDescription,
    );
    await transfersPage.confirmApprove();
    await transfersPage.verifyTransferStatus(
      shared.pendingTransferId,
      data.expectedStatus,
    );
    shared.completedTransferId = shared.pendingTransferId;

  });
});

test.describe("RCSP-221 - Inventory Balances: ON HAND quantity for LARGE BUNS 11201 is incremented by 1 on WB Unit 1025 Inventory Bal...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the ON HAND quantity for LARGE BUNS 11201 is incremented by 1 on WB Unit 1025 Inventory Balances page after transfer approval", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      item: string;
      expectedOnHandChange: number;
    }>(TC.onHandIncrement1025);

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

test.describe("RCSP-221 - Dashboard: Recent Stock Movements section on the Dashboard displays a Transfer In record for LARGE...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the Recent Stock Movements section on the Dashboard displays a Transfer In record for LARGE BUNS with quantity +1 on WB Unit 1025 after transfer approval", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

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

test.describe("RCSP-221 - Inventory Balances: ON HAND quantity for LARGE BUNS 11201 is decremented by 1 on WB Unit 1034 Inventory Bal...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the ON HAND quantity for LARGE BUNS 11201 is decremented by 1 on WB Unit 1034 Inventory Balances page after transfer approval", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      item: string;
      expectedOnHandChange: number;
    }>(TC.onHandDecrement1034);

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

test.describe("RCSP-221 - Dashboard: Recent Stock Movements section on the Dashboard displays a Transfer Out record for LARG...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the Recent Stock Movements section on the Dashboard displays a Transfer Out record for LARGE BUNS with quantity -1 on WB Unit 1034 after transfer approval", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

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

test.describe("RCSP-221 - Transfers: New Transfer form displays validation when mandatory From Store field is not selected o...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the New Transfer form displays validation when mandatory From Store field is not selected on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ toStore: string }>(TC.validationFromStore);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(common.item.nameOrSku, common.item.quantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

  });
});

test.describe("RCSP-221 - Transfers: New Transfer form displays validation when mandatory To Store field is not selected on...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the New Transfer form displays validation when mandatory To Store field is not selected on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ fromStore: string }>(TC.validationToStore);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(common.item.nameOrSku, common.item.quantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

  });
});

test.describe("RCSP-221 - Transfers: New Transfer form displays validation when mandatory Transfer Reason field is not selec...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the New Transfer form displays validation when mandatory Transfer Reason field is not selected on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ fromStore: string; toStore: string }>(
      TC.validationReason,
    );

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.addItem(common.item.nameOrSku, common.item.quantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

  });
});

test.describe("RCSP-221 - Transfers: New Transfer form prevents submission when no item is added to the transfer on WB Unit...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the New Transfer form prevents submission when no item is added to the transfer on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ fromStore: string; toStore: string }>(
      TC.validationNoItems,
    );

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.fillNotes(common.transfer.notes);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

  });
});

test.describe("RCSP-221 - Transfers: New Transfer form prevents submission when item quantity is entered as 0 on WB Unit 1034", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the New Transfer form prevents submission when item quantity is entered as 0 on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ item: string; quantity: string }>(
      TC.validationZeroQty,
    );

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(common.hierarchy.sourceStore);
    await transfersPage.selectToStore(common.hierarchy.destinationStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(data.item, data.quantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

  });
});

test.describe("RCSP-221 - Transfers: New Transfer form prevents creating a transfer when From Store and To Store are the sam...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the New Transfer form prevents creating a transfer when From Store and To Store are the same on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ fromStore: string; toStore: string }>(
      TC.validationSameStore,
    );

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.fromStore);
    await transfersPage.selectToStore(data.toStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.addItem(common.item.nameOrSku, common.item.quantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible();

  });
});

test.describe("RCSP-221 - Transfers: New Transfer form blocks submission and displays an insufficient stock message when Qty...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the New Transfer form blocks submission and displays an insufficient stock message when Qty to Order exceeds ON HAND quantity on WB Unit 1034 Inventory Balances page", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      store: string;
      item: string;
      fromStore: string;
      toStore: string;
    }>(TC.validationInsufficientStock);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.store,
    );
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

    await transfersPage.openInventoryBalances();
    await transfersPage.searchInventoryItem(data.item);
    const after = await transfersPage.getOnHandValue(data.item);
    expect(after).toBe(onHand);

  });
});

test.describe("RCSP-221 - Transfers: Admin user can cancel a Draft transfer from the Draft Details page on WB Unit 1034", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can cancel a Draft transfer from the Draft Details page on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.createDraftTransfer({
      fromStore: common.hierarchy.sourceStore,
      toStore: common.hierarchy.destinationStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: common.item.nameOrSku,
      quantity: common.item.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    const draftId = await transfersPage.getLatestTransferId();
    await transfersPage.openTransferById(draftId);
    await transfersPage.cancelDraft(true);
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    await expect(transfersPage.transferRow(draftId)).toHaveCount(0);

  });
});

test.describe("RCSP-221 - Transfers: Clicking NO on the Reject Transfer confirmation modal keeps the transfer in Pending sta...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether clicking NO on the Reject Transfer confirmation modal keeps the transfer in Pending status on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.rejectModalNo);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
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
    await transfersPage.verifyRejectModalVisible();
    await transfersPage.reasonInput.fill(common.transfer.rejectionReason);
    await transfersPage.dismissModal();
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);
    await transfersPage.verifyPendingActionsVisible(transferId);

    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.confirmApprove();

  });
});

test.describe("RCSP-221 - Transfers: Clicking NO on the Approve Transfer confirmation modal keeps the transfer in Pending st...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether clicking NO on the Approve Transfer confirmation modal keeps the transfer in Pending status on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ expectedStatus: string }>(TC.approveModalNo);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
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
    await transfersPage.verifyApproveModalVisible();
    await transfersPage.dismissModal();
    await transfersPage.verifyTransferStatus(transferId, data.expectedStatus);
    await transfersPage.verifyPendingActionsVisible(transferId);

    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.confirmApprove();

  });
});

test.describe("RCSP-221 - Transfers: Completed transfer cannot be rejected or approved again on WB Unit 1025", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether a Completed transfer cannot be rejected or approved again on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

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

test.describe("RCSP-221 - Transfers: Declined transfer cannot be approved on WB Unit 1025", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether a Declined transfer cannot be approved on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

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

test.describe("RCSP-221 - Transfers: Admin user can save changes to a Draft transfer and the updated details are retained on...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can save changes to a Draft transfer and the updated details are retained on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ updatedNotes: string }>(TC.saveDraftChanges);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.createDraftTransfer({
      fromStore: common.hierarchy.sourceStore,
      toStore: common.hierarchy.destinationStore,
      reason: common.transfer.reason,
      notes: common.transfer.notes,
      item: common.item.nameOrSku,
      quantity: common.item.quantity,
      sku: common.item.sku,
    });
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    const draftId = await transfersPage.getLatestTransferId();
    await transfersPage.openTransferById(draftId);
    await transfersPage.fillNotes(data.updatedNotes);
    await transfersPage.saveChanges();
    await transfersPage.openTransfers();
    await transfersPage.selectStatusTab('Draft');
    await transfersPage.openTransferById(draftId);
    expect(await transfersPage.getNotesValue()).toContain(data.updatedNotes);
    await transfersPage.cancelDraft(true);

  });
});

test.describe("RCSP-221 - Transfers: Transfers page on WB Unit 1034 displays the NEW TRANSFER button, status section tabs, a...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the Transfers page on WB Unit 1034 displays the NEW TRANSFER button, status section tabs, and correct column headers in the transfers grid", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ statusTabs: string[]; columnHeaders: string[] }>(
      TC.transfersPageLayout,
    );

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.verifyNewTransferButtonEnabled();
    await transfersPage.verifyStatusTabs(data.statusTabs);
    await transfersPage.selectStatusTab('All');
    await transfersPage.verifyColumnHeaders(data.columnHeaders);

  });
});

test.describe("RCSP-221 - Transfers: New Transfer form rejects decimal/fractional Qty to Order and accepts only whole number...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the New Transfer form rejects decimal/fractional Qty to Order and accepts only whole number quantities on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      item: string;
      invalidQuantity: string;
      validQuantity: string;
    }>(TC.decimalQuantity);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(common.hierarchy.sourceStore);
    await transfersPage.selectToStore(common.hierarchy.destinationStore);
    await transfersPage.selectTransferReason(common.transfer.reason);
    await transfersPage.fillNotes(common.transfer.notes);
    await transfersPage.addItem(data.item, data.invalidQuantity, common.item.sku);
    await transfersPage.submitTransfer().catch(() => undefined);
    await transfersPage.verifyValidationVisible(/whole|integer|decimal|invalid|quantity/i);
    await transfersPage.fillQuantity(data.validQuantity);

  });
});

test.describe("RCSP-221 - Transfers: Transfer can be initiated only by the sending unit and users logged into the receiving...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether a transfer can be initiated only by the sending unit and users logged into the receiving unit cannot create a transfer on behalf of another store on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      activeStore: string;
      attemptedFromStore: string;
      toStore: string;
    }>(TC.receivingCannotInitiate);

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
      await transfersPage.addItem(common.item.nameOrSku, common.item.quantity, common.item.sku);
      await transfersPage.submitTransfer().catch(() => undefined);
      await transfersPage.verifyValidationVisible(
        /sending|only|not allowed|cannot|restricted|invalid/i,
      );
    } else {
      expect(canSelectForeignFrom).toBeFalsy();
    }

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.attemptedFromStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(data.attemptedFromStore);

  });
});

test.describe("RCSP-221 - Transfers: Transfer Reason dropdown on the New Transfer form displays all valid reason codes with...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the Transfer Reason dropdown on the New Transfer form displays all valid reason codes with correct labels on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{ reasonCodes: string[] }>(TC.reasonCodes);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.verifyReasonCodes(data.reasonCodes);

  });
});

test.describe("RCSP-221 - Transfers: Selecting Transfer Reason \"Other\" requires a mandatory comment in the Notes field befor...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether selecting Transfer Reason \"Other\" requires a mandatory comment in the Notes field before submission on WB Unit 1034", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      reason: string;
      filledNotes: string;
    }>(TC.otherReasonRequiresNotes);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      common.hierarchy.sourceStore,
    );
    await transfersPage.openTransfers();
    await transfersPage.clickNewTransfer();
    await transfersPage.selectFromStore(common.hierarchy.sourceStore);
    await transfersPage.selectToStore(common.hierarchy.destinationStore);
    await transfersPage.selectTransferReason(data.reason);
    await transfersPage.fillNotes('');
    await transfersPage.addItem(common.item.nameOrSku, common.item.quantity, common.item.sku);
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

test.describe("RCSP-221 - Transfers: Admin user can create, submit, and approve a transfer end-to-end from WB Unit 1034 to W...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the admin user can create, submit, and approve a transfer end-to-end from WB Unit 1034 to WB Unit 1025 with Pending and Completed status transitions", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      fromStore: string;
      toStore: string;
      item: string;
      quantity: string;
      statusFlow: string[];
    }>(TC.endToEndApprove);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.fromStore,
    );
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
    await transfersPage.verifyPendingActionsVisible(transferId);
    await transfersPage.clickApproveForTransfer(transferId);
    await transfersPage.verifyApproveModalVisible(
      'Approve this transfer?',
      'Completes the transfer and moves inventory to the destination.',
    );
    await transfersPage.confirmApprove();
    await transfersPage.verifyTransferStatus(transferId, data.statusFlow[1]);
    shared.completedTransferId = transferId;

  });
});

test.describe("RCSP-221 - Transfers: System creates a financial record when a transfer is completed from WB Unit 1034 to WB...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the system creates a financial record when a transfer is completed from WB Unit 1034 to WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

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

test.describe("RCSP-221 - Transfers: Transfer details and summary are exportable and printable as a transfer receipt from th...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the transfer details and summary are exportable and printable as a transfer receipt from the individual Completed transfer record page", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

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
    await transfersPage.exportTransferReceipt();
    await transfersPage.printTransferReceipt();

  });
});

test.describe("RCSP-221 - Transfers: Transfer receipt is exportable and printable from the Dashboard page for a recently com...", () => {
  let loginPage: RTCDashboardLoginPage;
  let transfersPage: TransfersPage;

  test("Verify whether the transfer receipt is exportable and printable from the Dashboard page for a recently completed transfer on WB Unit 1025", async ({ page }) => {
    ({ loginPage, transfersPage } = await loginAsAdmin(page));

    const common = getCommonData();
    const data = getCaseData<{
      activeStore: string;
      movementType: string;
      item: string;
      qty: string;
    }>(TC.exportPrintDashboard);

    await transfersPage.switchStore(
      common.hierarchy.region,
      common.hierarchy.market,
      data.activeStore,
    );
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
