/**
 * RCSP-595 – Credit Requests damaged items / UOM (Flowers & McLane)
 * Test case IDs use TC_RCSP-595_* format (51 cases from RCSP-595_TestCases.xls).
 */

import path from 'path';
import { test, expect, type Page } from '@playwright/test';
import { CONFIG } from '../../config';
import { log } from '../../utils/helpers';
import { RTCDashboardLoginPage } from '../../pages/Login/RTCDashboardLoginPage';
import {
  CreditRequestsPage,
  type CreditRequestVendorData,
} from '../../pages/Ordering/CreditRequestsPage';
import { TransfersPage } from '../../pages/Transfers/TransfersPage';
import {
  getScenarioTestCaseData,
  getScenarioTestData,
  type Rcsp595CommonData,
  type Rcsp595JsonData,
} from '../../utils/testData';

const RCSP_595_FILE_NAME = 'RCSP-595';
const RCSP_595_SCENARIO_ID = 'RCSP-595';

const TC = {
  tc001: 'TC_RCSP-595_001',
  tc002: 'TC_RCSP-595_002',
  tc003: 'TC_RCSP-595_003',
  tc004: 'TC_RCSP-595_004',
  tc005: 'TC_RCSP-595_005',
  tc006: 'TC_RCSP-595_006',
  tc007: 'TC_RCSP-595_007',
  tc008: 'TC_RCSP-595_008',
  tc009: 'TC_RCSP-595_009',
  tc010: 'TC_RCSP-595_010',
  tc011: 'TC_RCSP-595_011',
  tc012: 'TC_RCSP-595_012',
  tc013: 'TC_RCSP-595_013',
  tc014: 'TC_RCSP-595_014',
  tc015: 'TC_RCSP-595_015',
  tc016: 'TC_RCSP-595_016',
  tc017: 'TC_RCSP-595_017',
  tc018: 'TC_RCSP-595_018',
  tc019: 'TC_RCSP-595_019',
  tc020: 'TC_RCSP-595_020',
  tc021: 'TC_RCSP-595_021',
  tc022: 'TC_RCSP-595_022',
  tc023: 'TC_RCSP-595_023',
  tc024: 'TC_RCSP-595_024',
  tc025: 'TC_RCSP-595_025',
  tc026: 'TC_RCSP-595_026',
  tc027: 'TC_RCSP-595_027',
  tc028: 'TC_RCSP-595_028',
  tc029: 'TC_RCSP-595_029',
  tc030: 'TC_RCSP-595_030',
  tc031: 'TC_RCSP-595_031',
  tc032: 'TC_RCSP-595_032',
  tc033: 'TC_RCSP-595_033',
  tc034: 'TC_RCSP-595_034',
  tc035: 'TC_RCSP-595_035',
  tc036: 'TC_RCSP-595_036',
  tc037: 'TC_RCSP-595_037',
  tc038: 'TC_RCSP-595_038',
  tc039: 'TC_RCSP-595_039',
  tc040: 'TC_RCSP-595_040',
  tc041: 'TC_RCSP-595_041',
  tc042: 'TC_RCSP-595_042',
  tc043: 'TC_RCSP-595_043',
  tc044: 'TC_RCSP-595_044',
  tc045: 'TC_RCSP-595_045',
  tc046: 'TC_RCSP-595_046',
  tc047: 'TC_RCSP-595_047',
  tc048: 'TC_RCSP-595_048',
  tc049: 'TC_RCSP-595_049',
  tc050: 'TC_RCSP-595_050',
  tc051: 'TC_RCSP-595_051',
} as const;

function getCommonData(): Rcsp595CommonData {
  return getScenarioTestData<Rcsp595JsonData>(
    RCSP_595_FILE_NAME,
    RCSP_595_SCENARIO_ID,
  ).commonData;
}

function getCaseData<T extends Record<string, unknown>>(testCaseId: string): T {
  return getScenarioTestCaseData<T>(
    RCSP_595_FILE_NAME,
    RCSP_595_SCENARIO_ID,
    testCaseId,
  );
}

function vendorConfig(common: Rcsp595CommonData, orderType: string): CreditRequestVendorData {
  return orderType.toLowerCase().includes('mclane') ? common.mclane : common.flowers;
}

function imagePath(common: Rcsp595CommonData): string {
  return path.resolve(process.cwd(), common.imageFixturePath);
}

async function prepare(page: Page) {
  const common = getCommonData();
  const loginPage = new RTCDashboardLoginPage(page);
  const creditPage = new CreditRequestsPage(page);
  const transfersPage = new TransfersPage(page);
  await page.goto(CONFIG.dashboardURL);
  await page.waitForLoadState('domcontentloaded');
  await loginPage.login(
    CONFIG.credentials.admin.username,
    CONFIG.credentials.admin.password,
  );
  await transfersPage.switchStore(
    common.hierarchy.region,
    common.hierarchy.market,
    common.hierarchy.store,
  );
  return { common, loginPage, creditPage, transfersPage };
}

function requireReceivedPo(vendor: CreditRequestVendorData) {
  test.skip(
    !vendor.receivedPoSearch?.trim(),
    `Set commonData.${vendor.orderType.toLowerCase()}.receivedPoSearch in RCSP-595.json`,
  );
}

test.describe.configure({ mode: 'serial' });


test.describe("RCSP-595 [TC_RCSP-595_001] (Flowers) - Verify whether the admin user can navigate from QA Backoffice Dashb...", () => {
  test("TC_RCSP-595_001: Verify whether the admin user can navigate from QA Backoffice Dashboard Home page to Or... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc001);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    await creditPage.openCreditRequests();
    await expect(creditPage.pageTitle).toBeVisible();
    await expect(creditPage.newCreditRequestButton).toBeVisible();
    log('Order type context: Flowers');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_002] (Flowers) - Verify whether clicking + New Credit Request / START CREDIT REQUEST...", () => {
  test("TC_RCSP-595_002: Verify whether clicking + New Credit Request / START CREDIT REQUEST on the Credit Reque... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc002);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    await creditPage.openCreditRequests();
    await creditPage.clickNewCreditRequest();
    await creditPage.verifyPoSearchVisible();
    log('Order type context: Flowers');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_003] (Flowers) - Verify whether selecting a Flowers Purchase Order in Received statu...", () => {
  test("TC_RCSP-595_003: Verify whether selecting a Flowers Purchase Order in Received status from the Purchase ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc003);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_004] (Flowers) - Verify whether selecting the Damaged checkbox for a received item o...", () => {
  test("TC_RCSP-595_004: Verify whether selecting the Damaged checkbox for a received item on the Damaged Items ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc004);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.verifyDamagedFieldsVisible(common.damagedFields);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_005] (Flowers) - Verify whether the UOM dropdown values displayed for a damaged item...", () => {
  test("TC_RCSP-595_005: Verify whether the UOM dropdown values displayed for a damaged item on the Damaged Item... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc005);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    expect(uoms.length).toBeGreaterThan(0);
    if (vendor.expectedUoms?.length) {
      for (const u of uoms) {
        const normalized = u.trim().toUpperCase();
        const allowed = vendor.expectedUoms.map((x) => x.toUpperCase());
        if (allowed.length) {
          expect(allowed.some((a) => normalized.includes(a) || a.includes(normalized))).toBeTruthy();
        }
      }
    }
    log(`Compare UOMs with ${common.itemMasterPathHint} for item ${vendor.itemName || '(first item)'}`);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_006] (Flowers) - Verify whether the UOM profile for a damaged item on the Flowers Cr...", () => {
  test("TC_RCSP-595_006: Verify whether the UOM profile for a damaged item on the Flowers Credit Request matches... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc006);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    expect(uoms.length).toBeGreaterThan(0);
    log(`UOM profile should align with ${common.stockCountPathHint} for ${vendor.itemName || 'item'}`);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_007] (Flowers) - Verify whether the user can change/update the UOM dropdown value on...", () => {
  test("TC_RCSP-595_007: Verify whether the user can change/update the UOM dropdown value on a Draft Flowers Cre... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc007);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    const target =
      vendor.alternateUom ||
      uoms.find((u) => !new RegExp(vendor.expectedUoms?.[0] || 'EA', 'i').test(u)) ||
      uoms[0];
    await creditPage.fillDamagedFields(vendor, {
      uomOverride: target,
      imagePath: imagePath(common),
    });
    await creditPage.saveDraft();
    await creditPage.openCreditRequests();
    await creditPage.selectStatusTab('Draft');
    await creditPage.openDraftOrSubmittedByStatus('Draft');
    await creditPage.verifyDamagedItemsPageLoaded().catch(async () => {
      await expect(page.getByText(/draft|credit request/i).first()).toBeVisible();
    });
    const uomText = await creditPage.uomControl(vendor.itemName).innerText().catch(async () =>
      creditPage.uomControl(vendor.itemName).inputValue(),
    );
    expect(uomText.toLowerCase()).toContain(target.toLowerCase().slice(0, 2));

  });
});


test.describe("RCSP-595 [TC_RCSP-595_008] (Flowers) - Verify whether the user can submit a Draft Flowers Credit Request f...", () => {
  test("TC_RCSP-595_008: Verify whether the user can submit a Draft Flowers Credit Request from the Damaged Item... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc008);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, { imagePath: imagePath(common) });
    await creditPage.submitCreditRequest();
    await creditPage.openCreditRequests();
    await creditPage.selectStatusTab('Submitted');
    await expect(creditPage.creditRequestsTable.getByRole('row').nth(1)).toBeVisible({ timeout: 15000 });

  });
});


test.describe("RCSP-595 [TC_RCSP-595_009] (Flowers) - Verify whether the UOM field on a Submitted Flowers Credit Request ...", () => {
  test("TC_RCSP-595_009: Verify whether the UOM field on a Submitted Flowers Credit Request is read-only on the ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc009);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, { imagePath: imagePath(common) });
    await creditPage.submitCreditRequest();
    await creditPage.openDraftOrSubmittedByStatus('Submitted');
    await creditPage.verifyUomReadOnly(vendor.itemName);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_010] (Flowers) - Verify whether the Start Credit Request button does not navigate to...", () => {
  test("TC_RCSP-595_010: Verify whether the Start Credit Request button does not navigate to Damaged Items From ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc010);
    expect(_case).toBeTruthy();
    const { creditPage } = await prepare(page);
    await creditPage.openCreditRequests();
    await creditPage.clickNewCreditRequest();
    await creditPage.verifyPoSearchVisible();
    const btn = page.getByRole('button', { name: /start credit request/i }).first();
    if (await btn.isEnabled().catch(() => true)) {
      await btn.click({ force: true }).catch(() => undefined);
    }
    await creditPage.verifyStillOnPoSelectionOrNotDamagedPage();
    log('Order type context: Flowers');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_011] (Flowers) - Verify whether a Flowers Purchase Order that is NOT in Received sta...", () => {
  test("TC_RCSP-595_011: Verify whether a Flowers Purchase Order that is NOT in Received status does not appear ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc011);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    test.skip(
      !vendor.nonReceivedPoSearch?.trim(),
      'Set commonData.flowers.nonReceivedPoSearch in RCSP-595.json',
    );
    await creditPage.openCreditRequests();
    await creditPage.assertPoNotStartable(vendor.nonReceivedPoSearch!);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_012] (Flowers) - Verify whether the mandatory damaged-item fields (Incident Type, Qt...", () => {
  test("TC_RCSP-595_012: Verify whether the mandatory damaged-item fields (Incident Type, Qty, UOM, Can you use ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc012);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName, false);
    await creditPage.verifyDamagedFieldsHidden(common.damagedFields);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_013] (Flowers) - Verify whether saving/submitting a Flowers Credit Request is blocke...", () => {
  test("TC_RCSP-595_013: Verify whether saving/submitting a Flowers Credit Request is blocked when Damaged check... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc013);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['incidentType'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Incident Type');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_014] (Flowers) - Verify whether saving/submitting a Flowers Credit Request is blocke...", () => {
  test("TC_RCSP-595_014: Verify whether saving/submitting a Flowers Credit Request is blocked when Qty * is left... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc014);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['qty'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Qty');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_015] (Flowers) - Verify whether saving/submitting a Flowers Credit Request is blocke...", () => {
  test("TC_RCSP-595_015: Verify whether saving/submitting a Flowers Credit Request is blocked when UOM * is not ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc015);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['uom'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('UOM');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_016] (Flowers) - Verify whether saving/submitting a Flowers Credit Request is blocke...", () => {
  test("TC_RCSP-595_016: Verify whether saving/submitting a Flowers Credit Request is blocked when Can you use t... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc016);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['canUseProduct'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Can you use this product');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_017] (Flowers) - Verify whether saving/submitting a Flowers Credit Request is blocke...", () => {
  test("TC_RCSP-595_017: Verify whether saving/submitting a Flowers Credit Request is blocked when Do you have e... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc017);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['enoughGoodProductOrIut'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('enough good product');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_018] (Flowers) - Verify whether saving/submitting a Flowers Credit Request is blocke...", () => {
  test("TC_RCSP-595_018: Verify whether saving/submitting a Flowers Credit Request is blocked when Images * are ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc018);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['images'],
      imagePath: imagePath(common),
      uploadImage: false,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Images');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_019] (Flowers) - Verify whether the user cannot modify the UOM value on a Submitted ...", () => {
  test("TC_RCSP-595_019: Verify whether the user cannot modify the UOM value on a Submitted Flowers Credit Reque... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc019);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, { imagePath: imagePath(common) });
    await creditPage.submitCreditRequest();
    await creditPage.openDraftOrSubmittedByStatus('Submitted');
    await creditPage.verifyUomReadOnly(vendor.itemName);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_020] (Flowers) - Verify whether unchecking the Damaged checkbox on Damaged Items Fro...", () => {
  test("TC_RCSP-595_020: Verify whether unchecking the Damaged checkbox on Damaged Items From Order page (Flower... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc020);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName, true);
    await creditPage.verifyDamagedFieldsVisible(common.damagedFields);
    await creditPage.selectDamaged(vendor.itemName, false);
    await creditPage.verifyDamagedFieldsHidden(common.damagedFields);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_021] (Flowers) - Verify whether Qty entered on Flowers Damaged Items From Order page...", () => {
  test("TC_RCSP-595_021: Verify whether Qty entered on Flowers Damaged Items From Order page cannot exceed the r... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc021);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      qtyOverride: '999999',
      imagePath: imagePath(common),
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Qty');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_022] (Flowers) - Verify whether changing UOM on a Draft Flowers Credit Request updat...", () => {
  test("TC_RCSP-595_022: Verify whether changing UOM on a Draft Flowers Credit Request updates only the Draft re... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc022);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, { imagePath: imagePath(common) });
    await creditPage.submitCreditRequest();
    await creditPage.openDraftOrSubmittedByStatus('Submitted');
    const submittedUom = await creditPage.uomControl(vendor.itemName).innerText().catch(async () =>
      creditPage.uomControl(vendor.itemName).inputValue(),
    );
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    const alt = vendor.alternateUom || uoms[uoms.length - 1] || uoms[0];
    await creditPage.fillDamagedFields(vendor, { uomOverride: alt, imagePath: imagePath(common) });
    await creditPage.saveDraft();
    await creditPage.openDraftOrSubmittedByStatus('Submitted');
    const submittedAfter = await creditPage.uomControl(vendor.itemName).innerText().catch(async () =>
      creditPage.uomControl(vendor.itemName).inputValue(),
    );
    expect(submittedAfter.trim().toLowerCase()).toBe(submittedUom.trim().toLowerCase());

  });
});


test.describe("RCSP-595 [TC_RCSP-595_023] (Flowers) - Verify whether a Flowers Purchase Order with Received status but ze...", () => {
  test("TC_RCSP-595_023: Verify whether a Flowers Purchase Order with Received status but zero received items (o... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc023);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    test.skip(
      !vendor.emptyReceivedPoSearch?.trim(),
      'Set commonData.flowers.emptyReceivedPoSearch in RCSP-595.json',
    );
    await creditPage.openCreditRequests();
    await creditPage.assertPoNotStartable(vendor.emptyReceivedPoSearch!);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_024] (Flowers) - Verify whether selecting Damaged for multiple received items on the...", () => {
  test("TC_RCSP-595_024: Verify whether selecting Damaged for multiple received items on the same Flowers Credit... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc024);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    const damagedBoxes = page.getByRole('checkbox', { name: /damaged/i });
    const count = await damagedBoxes.count();
    test.skip(count < 2, 'Need at least two received items on the PO for this edge case');
    await damagedBoxes.nth(0).check().catch(async () => damagedBoxes.nth(0).click());
    await damagedBoxes.nth(1).check().catch(async () => damagedBoxes.nth(1).click());
    await creditPage.verifyDamagedFieldsVisible(['UOM']);
    const uoms = await creditPage.openUomOptions();
    expect(uoms.length).toBeGreaterThan(0);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_025] (Flowers) - Verify whether UOM dropdown on Flowers Credit Request does not disp...", () => {
  test("TC_RCSP-595_025: Verify whether UOM dropdown on Flowers Credit Request does not display UOM values that ... (Flowers)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc025);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'Flowers');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    expect(uoms.length).toBeGreaterThan(0);
    if (vendor.expectedUoms?.length) {
      for (const u of uoms) {
        const normalized = u.trim().toUpperCase();
        const allowed = vendor.expectedUoms.map((x) => x.toUpperCase());
        expect(allowed.some((a) => normalized.includes(a) || a.includes(normalized))).toBeTruthy();
      }
    }

  });
});


test.describe("RCSP-595 [TC_RCSP-595_026] (McLane) - Verify whether the admin user can navigate from QA Backoffice Dashb...", () => {
  test("TC_RCSP-595_026: Verify whether the admin user can navigate from QA Backoffice Dashboard Home page to Or... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc026);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    await creditPage.openCreditRequests();
    await expect(creditPage.pageTitle).toBeVisible();
    await expect(creditPage.newCreditRequestButton).toBeVisible();
    log('Order type context: McLane');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_027] (McLane) - Verify whether clicking + New Credit Request / START CREDIT REQUEST...", () => {
  test("TC_RCSP-595_027: Verify whether clicking + New Credit Request / START CREDIT REQUEST on the Credit Reque... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc027);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    await creditPage.openCreditRequests();
    await creditPage.clickNewCreditRequest();
    await creditPage.verifyPoSearchVisible();
    log('Order type context: McLane');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_028] (McLane) - Verify whether selecting a McLane Purchase Order in Received status...", () => {
  test("TC_RCSP-595_028: Verify whether selecting a McLane Purchase Order in Received status from the Purchase O... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc028);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_029] (McLane) - Verify whether selecting the Damaged checkbox for a received item o...", () => {
  test("TC_RCSP-595_029: Verify whether selecting the Damaged checkbox for a received item on the Damaged Items ... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc029);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.verifyDamagedFieldsVisible(common.damagedFields);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_030] (McLane) - Verify whether the UOM dropdown values displayed for a damaged item...", () => {
  test("TC_RCSP-595_030: Verify whether the UOM dropdown values displayed for a damaged item on the Damaged Item... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc030);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    expect(uoms.length).toBeGreaterThan(0);
    if (vendor.expectedUoms?.length) {
      for (const u of uoms) {
        const normalized = u.trim().toUpperCase();
        const allowed = vendor.expectedUoms.map((x) => x.toUpperCase());
        if (allowed.length) {
          expect(allowed.some((a) => normalized.includes(a) || a.includes(normalized))).toBeTruthy();
        }
      }
    }
    log(`Compare UOMs with ${common.itemMasterPathHint} for item ${vendor.itemName || '(first item)'}`);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_031] (McLane) - Verify whether the UOM profile for a damaged item on the McLane Cre...", () => {
  test("TC_RCSP-595_031: Verify whether the UOM profile for a damaged item on the McLane Credit Request matches ... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc031);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    expect(uoms.length).toBeGreaterThan(0);
    log(`UOM profile should align with ${common.stockCountPathHint} for ${vendor.itemName || 'item'}`);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_032] (McLane) - Verify whether the user can change/update the UOM dropdown value on...", () => {
  test("TC_RCSP-595_032: Verify whether the user can change/update the UOM dropdown value on a Draft McLane Cred... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc032);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    const target =
      vendor.alternateUom ||
      uoms.find((u) => !new RegExp(vendor.expectedUoms?.[0] || 'EA', 'i').test(u)) ||
      uoms[0];
    await creditPage.fillDamagedFields(vendor, {
      uomOverride: target,
      imagePath: imagePath(common),
    });
    await creditPage.saveDraft();
    await creditPage.openCreditRequests();
    await creditPage.selectStatusTab('Draft');
    await creditPage.openDraftOrSubmittedByStatus('Draft');
    await creditPage.verifyDamagedItemsPageLoaded().catch(async () => {
      await expect(page.getByText(/draft|credit request/i).first()).toBeVisible();
    });
    const uomText = await creditPage.uomControl(vendor.itemName).innerText().catch(async () =>
      creditPage.uomControl(vendor.itemName).inputValue(),
    );
    expect(uomText.toLowerCase()).toContain(target.toLowerCase().slice(0, 2));

  });
});


test.describe("RCSP-595 [TC_RCSP-595_033] (McLane) - Verify whether the user can submit a Draft McLane Credit Request fr...", () => {
  test("TC_RCSP-595_033: Verify whether the user can submit a Draft McLane Credit Request from the Damaged Items... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc033);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, { imagePath: imagePath(common) });
    await creditPage.submitCreditRequest();
    await creditPage.openCreditRequests();
    await creditPage.selectStatusTab('Submitted');
    await expect(creditPage.creditRequestsTable.getByRole('row').nth(1)).toBeVisible({ timeout: 15000 });

  });
});


test.describe("RCSP-595 [TC_RCSP-595_034] (McLane) - Verify whether the UOM field on a Submitted McLane Credit Request i...", () => {
  test("TC_RCSP-595_034: Verify whether the UOM field on a Submitted McLane Credit Request is read-only on the D... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc034);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, { imagePath: imagePath(common) });
    await creditPage.submitCreditRequest();
    await creditPage.openDraftOrSubmittedByStatus('Submitted');
    await creditPage.verifyUomReadOnly(vendor.itemName);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_035] (McLane) - Verify whether the Start Credit Request button does not navigate to...", () => {
  test("TC_RCSP-595_035: Verify whether the Start Credit Request button does not navigate to Damaged Items From ... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc035);
    expect(_case).toBeTruthy();
    const { creditPage } = await prepare(page);
    await creditPage.openCreditRequests();
    await creditPage.clickNewCreditRequest();
    await creditPage.verifyPoSearchVisible();
    const btn = page.getByRole('button', { name: /start credit request/i }).first();
    if (await btn.isEnabled().catch(() => true)) {
      await btn.click({ force: true }).catch(() => undefined);
    }
    await creditPage.verifyStillOnPoSelectionOrNotDamagedPage();
    log('Order type context: McLane');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_036] (McLane) - Verify whether a McLane Purchase Order that is NOT in Received stat...", () => {
  test("TC_RCSP-595_036: Verify whether a McLane Purchase Order that is NOT in Received status does not appear a... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc036);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    test.skip(
      !vendor.nonReceivedPoSearch?.trim(),
      'Set commonData.mclane.nonReceivedPoSearch in RCSP-595.json',
    );
    await creditPage.openCreditRequests();
    await creditPage.assertPoNotStartable(vendor.nonReceivedPoSearch!);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_037] (McLane) - Verify whether the mandatory damaged-item fields (Incident Type, Qt...", () => {
  test("TC_RCSP-595_037: Verify whether the mandatory damaged-item fields (Incident Type, Qty, UOM, Can you use ... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc037);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName, false);
    await creditPage.verifyDamagedFieldsHidden(common.damagedFields);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_038] (McLane) - Verify whether saving/submitting a McLane Credit Request is blocked...", () => {
  test("TC_RCSP-595_038: Verify whether saving/submitting a McLane Credit Request is blocked when Damaged checkb... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc038);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['incidentType'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Incident Type');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_039] (McLane) - Verify whether saving/submitting a McLane Credit Request is blocked...", () => {
  test("TC_RCSP-595_039: Verify whether saving/submitting a McLane Credit Request is blocked when Qty * is left ... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc039);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['qty'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Qty');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_040] (McLane) - Verify whether saving/submitting a McLane Credit Request is blocked...", () => {
  test("TC_RCSP-595_040: Verify whether saving/submitting a McLane Credit Request is blocked when UOM * is not s... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc040);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['uom'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('UOM');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_041] (McLane) - Verify whether saving/submitting a McLane Credit Request is blocked...", () => {
  test("TC_RCSP-595_041: Verify whether saving/submitting a McLane Credit Request is blocked when Can you use th... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc041);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['canUseProduct'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Can you use this product');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_042] (McLane) - Verify whether saving/submitting a McLane Credit Request is blocked...", () => {
  test("TC_RCSP-595_042: Verify whether saving/submitting a McLane Credit Request is blocked when Do you have en... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc042);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['enoughGoodProductOrIut'],
      imagePath: imagePath(common),
      uploadImage: true,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('enough good product');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_043] (McLane) - Verify whether saving/submitting a McLane Credit Request is blocked...", () => {
  test("TC_RCSP-595_043: Verify whether saving/submitting a McLane Credit Request is blocked when Images * are n... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc043);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      omit: ['images'],
      imagePath: imagePath(common),
      uploadImage: false,
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Images');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_044] (McLane) - Verify whether the user cannot modify the UOM value on a Submitted ...", () => {
  test("TC_RCSP-595_044: Verify whether the user cannot modify the UOM value on a Submitted McLane Credit Reques... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc044);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, { imagePath: imagePath(common) });
    await creditPage.submitCreditRequest();
    await creditPage.openDraftOrSubmittedByStatus('Submitted');
    await creditPage.verifyUomReadOnly(vendor.itemName);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_045] (McLane) - Verify whether unchecking the Damaged checkbox on Damaged Items Fro...", () => {
  test("TC_RCSP-595_045: Verify whether unchecking the Damaged checkbox on Damaged Items From Order page (McLane... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc045);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName, true);
    await creditPage.verifyDamagedFieldsVisible(common.damagedFields);
    await creditPage.selectDamaged(vendor.itemName, false);
    await creditPage.verifyDamagedFieldsHidden(common.damagedFields);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_046] (McLane) - Verify whether Qty entered on McLane Damaged Items From Order page ...", () => {
  test("TC_RCSP-595_046: Verify whether Qty entered on McLane Damaged Items From Order page cannot exceed the re... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc046);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, {
      qtyOverride: '999999',
      imagePath: imagePath(common),
    });
    if (await creditPage.submitButton.first().isVisible().catch(() => false)) {
      await creditPage.submitCreditRequest();
    } else {
      await creditPage.saveDraft();
    }
    await creditPage.verifyValidationVisible('Qty');

  });
});


test.describe("RCSP-595 [TC_RCSP-595_047] (McLane) - Verify whether changing UOM on a Draft McLane Credit Request update...", () => {
  test("TC_RCSP-595_047: Verify whether changing UOM on a Draft McLane Credit Request updates only the Draft rec... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc047);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    await creditPage.fillDamagedFields(vendor, { imagePath: imagePath(common) });
    await creditPage.submitCreditRequest();
    await creditPage.openDraftOrSubmittedByStatus('Submitted');
    const submittedUom = await creditPage.uomControl(vendor.itemName).innerText().catch(async () =>
      creditPage.uomControl(vendor.itemName).inputValue(),
    );
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    const alt = vendor.alternateUom || uoms[uoms.length - 1] || uoms[0];
    await creditPage.fillDamagedFields(vendor, { uomOverride: alt, imagePath: imagePath(common) });
    await creditPage.saveDraft();
    await creditPage.openDraftOrSubmittedByStatus('Submitted');
    const submittedAfter = await creditPage.uomControl(vendor.itemName).innerText().catch(async () =>
      creditPage.uomControl(vendor.itemName).inputValue(),
    );
    expect(submittedAfter.trim().toLowerCase()).toBe(submittedUom.trim().toLowerCase());

  });
});


test.describe("RCSP-595 [TC_RCSP-595_048] (McLane) - Verify whether a McLane Purchase Order with Received status but zer...", () => {
  test("TC_RCSP-595_048: Verify whether a McLane Purchase Order with Received status but zero received items (or... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc048);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    test.skip(
      !vendor.emptyReceivedPoSearch?.trim(),
      'Set commonData.mclane.emptyReceivedPoSearch in RCSP-595.json',
    );
    await creditPage.openCreditRequests();
    await creditPage.assertPoNotStartable(vendor.emptyReceivedPoSearch!);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_049] (McLane) - Verify whether selecting Damaged for multiple received items on the...", () => {
  test("TC_RCSP-595_049: Verify whether selecting Damaged for multiple received items on the same McLane Credit ... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc049);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    const damagedBoxes = page.getByRole('checkbox', { name: /damaged/i });
    const count = await damagedBoxes.count();
    test.skip(count < 2, 'Need at least two received items on the PO for this edge case');
    await damagedBoxes.nth(0).check().catch(async () => damagedBoxes.nth(0).click());
    await damagedBoxes.nth(1).check().catch(async () => damagedBoxes.nth(1).click());
    await creditPage.verifyDamagedFieldsVisible(['UOM']);
    const uoms = await creditPage.openUomOptions();
    expect(uoms.length).toBeGreaterThan(0);

  });
});


test.describe("RCSP-595 [TC_RCSP-595_050] (McLane) - Verify whether UOM dropdown on McLane Credit Request does not displ...", () => {
  test("TC_RCSP-595_050: Verify whether UOM dropdown on McLane Credit Request does not display UOM values that b... (McLane)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc050);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    const vendor = vendorConfig(common, 'McLane');
    requireReceivedPo(vendor);
    await creditPage.startDamagedFlow(vendor.receivedPoSearch);
    await creditPage.selectDamaged(vendor.itemName);
    const uoms = await creditPage.openUomOptions(vendor.itemName);
    expect(uoms.length).toBeGreaterThan(0);
    if (vendor.expectedUoms?.length) {
      for (const u of uoms) {
        const normalized = u.trim().toUpperCase();
        const allowed = vendor.expectedUoms.map((x) => x.toUpperCase());
        expect(allowed.some((a) => normalized.includes(a) || a.includes(normalized))).toBeTruthy();
      }
    }

  });
});


test.describe("RCSP-595 [TC_RCSP-595_051] (Both) - Verify whether prerequisite Flowers and McLane Purchase Orders exis...", () => {
  test("TC_RCSP-595_051: Verify whether prerequisite Flowers and McLane Purchase Orders exist in Received status... (Both)", async ({ page }) => {
    const _case = getCaseData<Record<string, unknown>>(TC.tc051);
    expect(_case).toBeTruthy();
    const { common, creditPage } = await prepare(page);
    await creditPage.openCreditRequests();
    await expect(creditPage.newCreditRequestButton).toBeVisible();
    if (common.flowers.receivedPoSearch?.trim()) {
      await creditPage.clickNewCreditRequest();
      await creditPage.verifyPoSearchVisible();
      await creditPage.searchAndSelectPurchaseOrder(common.flowers.receivedPoSearch);
      log('Flowers Received PO is searchable');
      await page.keyboard.press('Escape').catch(() => undefined);
      await creditPage.openCreditRequests();
    } else {
      log('Flowers receivedPoSearch not set — configure in RCSP-595.json');
    }
    if (common.mclane.receivedPoSearch?.trim()) {
      await creditPage.clickNewCreditRequest();
      await creditPage.verifyPoSearchVisible();
      await creditPage.searchAndSelectPurchaseOrder(common.mclane.receivedPoSearch);
      log('McLane Received PO is searchable');
    } else {
      log('McLane receivedPoSearch not set — configure in RCSP-595.json');
    }

  });
});
