/**
 * Test Data
 * =========
 * Centralised store for test credentials and data loaded from JSON files.
 * JSON files are located in test-data/ directory:
 *   - users.json: User credentials
 *   - environments.json: Environment-specific URLs
 *   - config.json: Configuration values
 *   - testCases.json: Test case specific data
 *
 * Usage:
 *   import { TEST_USERS, CONFIG, ENVIRONMENTS, TEST_CASES, databaseReader } from './utils/testData';
 *   // Static references
 *   const adminUser = TEST_USERS.BACKOFFICE_ADMIN;
 *   const environment = ENVIRONMENTS[process.env.ENVIRONMENT || 'qa'];
 *   const testData = TEST_CASES['RCSP-115'];
 *   const rcsp115Data = jsonTestDataReader.getScenario<Rcsp115JsonData>('RCSP-115', 'RCSP-115');
 *   const itemNameOrSku = jsonTestDataReader.getScenarioValue<string>(
 *     'RCSP-115',
 *     'RCSP-115',
 *     'testData.weeklyCount.search.existingItemNameOrSku',
 *   );
 *
 *   // For dynamic data fetching
 *   const inventoryItems = await databaseReader.getActiveInventoryItems(1004);
 */

import * as path from 'path';
import * as fs from 'fs';
import { DatabaseReader } from './databaseReader';

type JsonPathSegment = string | number;
type JsonPath = string | readonly JsonPathSegment[];

export type CountShiftData = 'AM' | 'Mid-Shift' | 'PM';
export type CountUnitData = 'cs' | 'pk' | 'ea';

export interface TestStepData {
  step: number;
  description: string;
  expectedResult: string;
}

export interface WeeklyCountJsonData {
  filters: {
    defaultLocation: string;
    detailLocation: string;
  };
  search: {
    existingItemNameOrSku: string;
    missingItemNameOrSku: string;
  };
  itemUpdate: {
    itemNameOrSku: string;
    unit: CountUnitData;
    value: string;
  };
  createCount: {
    shift: CountShiftData;
    shiftDate?: string;
    name?: string;
  };
}

export interface MonthlyCountJsonData {
  filters: {
    defaultLocation: string;
    detailLocation: string;
  };
  search: {
    missingItemNameOrSku: string;
  };
  createCount: {
    shift: CountShiftData;
    shiftDate?: string;
  };
}

export interface TestCaseJsonData<TTestData = unknown> {
  testCaseId: string;
  testName: string;
  description: string;
  testSteps?: TestStepData[];
  testData: TTestData;
}

export interface Rcsp206CountLocationsPageTestData {
  navigationItems: string[];
}

export interface Rcsp206CreateLocationItem {
  locationName: string;
  description: string;
}

export interface Rcsp206CreateLocationTestData {
  navigationItems: string[];
  createCountLocationItems: Rcsp206CreateLocationItem[];
}

export interface Rcsp206AssignItemPopup {
  locationName: string;
  itemName: string;
}
export interface Rcsp206AssignItemPopupTestData {
  navigationItems: string[];
  assignItemPopupItems: Rcsp206AssignItemPopup[];
}

export interface ScenarioWithTestCases<
  TTestCase extends TestCaseJsonData = TestCaseJsonData,
> {
  testCases: TTestCase[];
}

export interface Rcsp115NavigationTestData {
  navigationItems: string[];
}

export interface Rcsp115ButtonVisibilityTestData {
  expectedButtons: {
    dailyShiftCount: string;
    weeklyCount: string;
    monthlyCount: string;
  };
}

export interface Rcsp115SessionCreationTestData {
  shifts: {
    dailyShiftCount: CountShiftData;
    weeklyCount: CountShiftData;
    monthlyCount: CountShiftData;
  };
}

export type Rcsp115TestCaseData =
  | Rcsp115NavigationTestData
  | Rcsp115ButtonVisibilityTestData
  | WeeklyCountJsonData
  | MonthlyCountJsonData
  | Rcsp115SessionCreationTestData;

export type Rcsp115TestCase = TestCaseJsonData<Rcsp115TestCaseData>;

export interface OrderingSectionJsonData {
  url: string;
  heading: string;
  dropdowns: Array<{
    name: string;
    options: string[];
  }>;
  textFields: string[];
  controls: string[];
  statusFilters?: string[];
  inferredOrderTypes?: string[];
}

export interface Rcsp166JsonData {
  testName: string;
  testId: string;
  epic: string;
  description: string;
  extractedAt: string;
  sections: {
    scheduledOrders: OrderingSectionJsonData;
    hotShotOrders: OrderingSectionJsonData;
    orderHistory: OrderingSectionJsonData;
  };
  relationships: string[];
}

export interface Rcsp115JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  commonData?: {
    prerequisites?: string[];
    userRole?: string;
  };
  testCases: Rcsp115TestCase[];
}

export interface Rcsp172HierarchyData {
  region: string;
  market: string;
  store: string;
}

export interface Rcsp172CreateCountData {
  shift: string;
  shiftDate: string;
  dailyName?: string;
  weeklyName?: string;
}

export interface Rcsp172CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp172HierarchyData;
  createCount: Rcsp172CreateCountData;
  countTypes: string[];
  activeItem: {
    partialName: string;
    plu: string;
    name: string;
  };
  inactiveItem: {
    searchTerm: string;
    note?: string;
  };
}

export type Rcsp172TestCaseData = Record<string, unknown>;

export type Rcsp172TestCase = TestCaseJsonData<Rcsp172TestCaseData> & {
  testType?: string;
  preCondition?: string;
};

export interface Rcsp172JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp172CommonData;
  testCases: Rcsp172TestCase[];
}

export interface Rcsp171HierarchyData {
  region: string;
  market: string;
  store: string;
}

export interface Rcsp171CreateCountData {
  shiftDate: string;
  namePrefix?: string;
}

export interface Rcsp171CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp171HierarchyData;
  createCount: Rcsp171CreateCountData;
  allowedShifts: string[];
  forbiddenShifts: string[];
  forbiddenMenus: string[];
  requiredMenus: string[];
  activeItem: {
    name: string;
    plu: string;
  };
  inactiveItem: {
    searchTerm: string;
    note?: string;
  };
  shiftWindows: Record<string, { start: string; end: string }>;
}

export type Rcsp171TestCaseData = Record<string, unknown>;

export type Rcsp171TestCase = TestCaseJsonData<Rcsp171TestCaseData> & {
  testType?: string;
  preCondition?: string;
};

export interface Rcsp171JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp171CommonData;
  testCases: Rcsp171TestCase[];
}

export interface Rcsp211HierarchyData {
  region: string;
  market: string;
  store: string;
}

export interface Rcsp211CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp211HierarchyData;
  createCount: {
    shift: string;
    shiftDate: string;
    namePrefix?: string;
  };
  item: {
    name: string;
    plu: string;
    searchTerm: string;
  };
  locations: {
    primary: string;
    secondary: string;
  };
  fallbackVarianceThresholdPercent: number;
  fallbackExpectedQuantity: number;
}

export type Rcsp211TestCaseData = Record<string, unknown>;

export type Rcsp211TestCase = TestCaseJsonData<Rcsp211TestCaseData> & {
  testType?: string;
  module?: string;
};

export interface Rcsp211JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp211CommonData;
  testCases: Rcsp211TestCase[];
}

export interface Rcsp212HierarchyData {
  region: string;
  market: string;
  store: string;
}

export interface Rcsp212ItemRef {
  name: string;
  plu?: string;
  searchTerm: string;
  note?: string;
}

export interface Rcsp212CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp212HierarchyData;
  createCount: {
    shift: string;
    shiftDate: string;
    namePrefix?: string;
  };
  location: string;
  activeItem: Rcsp212ItemRef;
  secondaryItem: Rcsp212ItemRef;
  tertiaryItem: Rcsp212ItemRef;
  inactiveItem: {
    searchTerm: string;
    note?: string;
  };
  positiveQuantity: string;
  invalidInputs: string[];
}

export type Rcsp212TestCaseData = Record<string, unknown>;

export type Rcsp212TestCase = TestCaseJsonData<Rcsp212TestCaseData> & {
  testType?: string;
  preCondition?: string;
};

export interface Rcsp212JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp212CommonData;
  testCases: Rcsp212TestCase[];
}

export interface Rcsp220HierarchyData {
  region: string;
  market: string;
  sourceStore: string;
  destinationStore: string;
}

export interface Rcsp220ItemData {
  nameOrSku: string;
  displayName: string;
  uom: string;
  quantity: string;
  invalidItem: string;
  decimalQuantity: string;
  zeroQuantity: string;
  sku?: string;
}

export interface Rcsp220TransferCommonData {
  reason: string;
  notes: string;
  updatedNotes: string;
  rejectionReason: string;
  otherReason: string;
  otherNotes: string;
  reasonCodes: string[];
}

export interface Rcsp220CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp220HierarchyData;
  item: Rcsp220ItemData;
  transfer: Rcsp220TransferCommonData;
  statusTabs: string[];
  columnHeaders: string[];
  buttons: {
    newTransfer: string;
    addItem: string;
    saveChanges: string;
    submitTransfer: string;
    cancel: string;
    approve: string;
    reject: string;
  };
}

export type Rcsp220TestCaseData = Record<string, unknown>;

export type Rcsp220TestCase = TestCaseJsonData<Rcsp220TestCaseData> & {
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp220JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp220CommonData;
  testCases: Rcsp220TestCase[];
}

export interface Rcsp169HierarchyData {
  region: string;
  market: string;
  store: string;
}

export interface Rcsp169LabelsData {
  menuCreditRequests: string;
  menuCreditMemos: string;
  pageTitle: string;
  pageDescription: string;
  newCreditRequest: string;
  newCreditMemo: string;
  summaryDraftClaimValue: string;
  summarySubmitted: string;
}

export interface Rcsp169CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp169HierarchyData;
  labels: Rcsp169LabelsData;
  statusTabs: string[];
  legacyUrlSegment: string;
  alternateOrderingItem: string;
  authorizedUser: {
    role: string;
    useConfigCredentials: boolean;
  };
  unauthorizedUser: {
    username: string;
    password: string;
    note?: string;
  };
}

export type Rcsp169TestCaseData = Record<string, unknown>;

export type Rcsp169TestCase = TestCaseJsonData<Rcsp169TestCaseData> & {
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp169JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp169CommonData;
  testCases: Rcsp169TestCase[];
}

export interface Rcsp595HierarchyData {
  region: string;
  market: string;
  store: string;
}

export interface Rcsp595VendorData {
  orderType: string;
  receivedPoSearch: string;
  nonReceivedPoSearch?: string;
  emptyReceivedPoSearch?: string;
  itemName?: string;
  itemSku?: string;
  expectedUoms?: string[];
  alternateUom?: string;
  incidentType?: string;
  qty?: string;
  canUseProduct?: string;
  enoughGoodProductOrIut?: string;
  note?: string;
}

export interface Rcsp595LabelsData {
  pageTitle: string;
  newCreditRequest: string;
  startCreditRequest: string;
  damagedItemsPageTitle: string;
  purchaseOrderSearch: string;
}

export interface Rcsp595CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp595HierarchyData;
  labels: Rcsp595LabelsData;
  damagedFields: string[];
  flowers: Rcsp595VendorData;
  mclane: Rcsp595VendorData;
  imageFixturePath: string;
  itemMasterPathHint?: string;
  stockCountPathHint?: string;
}

export type Rcsp595TestCaseData = Record<string, unknown>;

export type Rcsp595TestCase = TestCaseJsonData<Rcsp595TestCaseData> & {
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp595JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp595CommonData;
  testCases: Rcsp595TestCase[];
}

export interface Rcsp41HierarchyData {
  region: string;
  market: string;
  store: string;
}

export interface Rcsp41WasteEntryData {
  type: string;
  item?: string;
  sku?: string;
  recipe?: string;
  reason: string;
  uom: string;
  quantity: string;
  notes: string;
}

export interface Rcsp41CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp41HierarchyData;
  labels: Record<string, string>;
  columnHeaders: string[];
  shiftOptions: string[];
  defaultShift: string;
  wasteReasons: string[];
  itemEntry: Rcsp41WasteEntryData;
  recipeEntry: Rcsp41WasteEntryData;
  edgeValues: {
    decimalQuantity: string;
    largeQuantity: string;
    notesSpecial: string;
  };
  legacyRoute: string;
  unauthorizedUser: {
    username: string;
    password: string;
    note?: string;
  };
}

export type Rcsp41TestCaseData = Record<string, unknown>;

export type Rcsp41TestCase = TestCaseJsonData<Rcsp41TestCaseData> & {
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp41JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp41CommonData;
  testCases: Rcsp41TestCase[];
}

export interface Rcsp227CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: {
    region: string;
    market: string;
    store: string;
  };
  shiftOptions: string[];
  defaultShift: string;
  wasteCategories: string[];
  types: string[];
  item: {
    name: string;
    sku: string;
    uom: string;
    quantity: string;
    quantityGtOne: string;
    decimalQuantity: string;
  };
  recipe: {
    name: string;
    uom: string;
    quantity: string;
    quantityGtOne: string;
  };
  employeeId: string;
  notes: string;
  rawWasteReason: string;
  completedWasteReason: string;
  rawWasteReasons: string[];
  completedWasteReasons: string[];
  newReasonCode: {
    code: string;
    category: string;
  };
  unauthorizedUser: { username: string; password: string };
  nonAdminUser: { username: string; password: string };
  mobileViewport: { width: number; height: number };
  routes: { logWaste: string; wasteHistory: string };
}

export type Rcsp227TestCaseData = Record<string, unknown>;

export type Rcsp227TestCase = TestCaseJsonData<Rcsp227TestCaseData> & {
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp227JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp227CommonData;
  testCases: Rcsp227TestCase[];
}

export interface Rcsp472MenuPathData {
  section: string;
  item: string;
  urlSegment: string;
}

export interface Rcsp472LabelsData {
  pageTitle: string;
  pageSubtitle: string;
  newRoleButton: string;
  rolesTab: string;
  permissionsCatalogTab: string;
  searchPlaceholder: string;
}

export interface Rcsp472OperationsAdminData {
  displayName: string;
  roleKey: string;
  description: string;
  expectedPermissions: number;
  expectedUsers: number;
  expectedStatus: string;
}

export interface Rcsp472SearchData {
  validFullName: string;
  partial: string;
  roleKey: string;
  invalid: string;
  mixedCase: string;
  whitespace: string;
}

export interface Rcsp472AssignmentData {
  roleToSelect: string;
  assignmentScreenHint: string;
  inactiveStatus: string;
}

export interface Rcsp472CommonData {
  prerequisites?: string[];
  userRole?: string;
  menuPath: Rcsp472MenuPathData;
  labels: Rcsp472LabelsData;
  columnHeaders: string[];
  operationsAdmin: Rcsp472OperationsAdminData;
  baselineRoles: string[];
  lockedRole: string;
  search: Rcsp472SearchData;
  assignment: Rcsp472AssignmentData;
}

export type Rcsp472TestCaseData = Record<string, unknown>;

export type Rcsp472TestCase = TestCaseJsonData<Rcsp472TestCaseData> & {
  sourceTestCaseId?: string;
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp472JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp472CommonData;
  testCases: Rcsp472TestCase[];
}

export interface Rcsp133HierarchyData {
  region: string;
  market: string;
  store: string;
}

export interface Rcsp133MenuPathData {
  section: string;
  item: string;
  urlSegment: string;
}

export interface Rcsp133ServiceBusData {
  namespace: string;
  topic: string;
  subscriber: string;
}

export interface Rcsp133LabelsData {
  pageTitle: string;
  pageSubtitlePattern: string;
  mealPeriodAll: string;
  clearFilters: string;
}

export interface Rcsp133CommonData {
  prerequisites?: string[];
  userRole?: string;
  hierarchy: Rcsp133HierarchyData;
  menuPath: Rcsp133MenuPathData;
  serviceBus: Rcsp133ServiceBusData;
  labels: Rcsp133LabelsData;
  summaryCards: string[];
  viewTabs: string[];
  columnHeaders: string[];
  expectedSaleType: string;
  expectedSaleStatus: string;
  emptyBusinessDay: string;
  unloadedSaleId: string;
  edgeMealPeriod: string;
}

export type Rcsp133TestCaseData = Record<string, unknown>;

export type Rcsp133TestCase = TestCaseJsonData<Rcsp133TestCaseData> & {
  sourceTestCaseId?: string;
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp133JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp133CommonData;
  testCases: Rcsp133TestCase[];
}

export interface Rcsp287MenuPathData {
  section: string;
  item: string;
  urlSegment: string;
}

export interface Rcsp287LabelsData {
  pageTitle: string;
  pageSubtitle: string;
  newUomButton: string;
  modalTitle: string;
  typePlaceholder: string;
  cancelButton: string;
  createButton: string;
}

export interface Rcsp287UomValues {
  name: string;
  abbreviation: string;
  type: string;
}

export interface Rcsp287CommonData {
  prerequisites?: string[];
  userRole?: string;
  menuPath: Rcsp287MenuPathData;
  labels: Rcsp287LabelsData;
  columnHeaders: string[];
  typeOptions: string[];
  createUom: Rcsp287UomValues;
  updatedUom: Rcsp287UomValues;
  baselineUoms: string[];
  duplicateReference: Rcsp287UomValues;
}

export type Rcsp287TestCaseData = Record<string, unknown>;

export type Rcsp287TestCase = TestCaseJsonData<Rcsp287TestCaseData> & {
  sourceTestCaseId?: string;
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp287JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp287CommonData;
  testCases: Rcsp287TestCase[];
}

export interface Rcsp310MenuPathData {
  inventorySection: string;
  inventorySetupSection: string;
  foodCostSection: string;
  inventoryBalances: string;
  storeInventoryItems: string;
  storeItemsUrl: string;
  balancesUrl: string;
  uomUrl: string;
}

export interface Rcsp310PermissionData {
  displayName: string;
  permissionKey: string;
}

export interface Rcsp310RestrictedUserData {
  username: string;
  password: string;
  note?: string;
}

export interface Rcsp310CommonData {
  prerequisites?: string[];
  userRole?: string;
  menuPath: Rcsp310MenuPathData;
  inventoryPermissions: Rcsp310PermissionData[];
  administratorRole: string;
  nonLockedRole: string;
  stores: {
    storeA: string;
    storeB: string;
  };
  search: {
    validItemName: string;
    validSku: string;
    invalidQuery: string;
  };
  uomSample: {
    name: string;
    abbreviation: string;
  };
  restrictedUsers: {
    neitherInventoryRead: Rcsp310RestrictedUserData;
    balancesOnly: Rcsp310RestrictedUserData;
    storeItemsReadOnly: Rcsp310RestrictedUserData;
    storeItemsManage: Rcsp310RestrictedUserData;
  };
}

export type Rcsp310TestCaseData = Record<string, unknown>;

export type Rcsp310TestCase = TestCaseJsonData<Rcsp310TestCaseData> & {
  sourceTestCaseId?: string;
  module?: string;
  preCondition?: string;
  expectedResult?: string;
  rawTestData?: string;
};

export interface Rcsp310JsonData {
  scenarioId: string;
  epic: string;
  feature: string;
  sourceSheet?: string;
  description?: string;
  commonData: Rcsp310CommonData;
  testCases: Rcsp310TestCase[];
}

const databaseReader = new DatabaseReader();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * JsonTestDataReader
 * ==================
 * Reusable loader for test-data JSON files with caching and nested path access.
 * Designed for data-driven tests that want to keep values such as `itemNameOrSku`
 * in JSON instead of hardcoding them in spec files.
 */
export class JsonTestDataReader {
  private readonly baseDirectory: string;
  private readonly cache = new Map<string, unknown>();

  constructor(baseDirectory?: string) {
    this.baseDirectory = baseDirectory || this.resolveBaseDirectory();
  }

  /** Load a full JSON file from the test-data directory. */
  loadFile<T>(fileName: string): T {
    const normalizedFileName = this.normalizeFileName(fileName);
    const cachedValue = this.cache.get(normalizedFileName);

    if (cachedValue !== undefined) {
      return cachedValue as T;
    }

    const filePath = path.join(this.baseDirectory, normalizedFileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(
        `[JsonTestDataReader] JSON file not found: ${normalizedFileName}`,
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsedContent = JSON.parse(fileContent) as T;

    this.cache.set(normalizedFileName, parsedContent);

    return parsedContent;
  }

  /** Return one top-level test scenario from a JSON file keyed by scenario ID. */
  getScenario<T>(fileName: string, scenarioKey: string): T {
    const fileData = this.loadFile<Record<string, T>>(fileName);

    if (!(scenarioKey in fileData)) {
      throw new Error(
        `[JsonTestDataReader] Scenario "${scenarioKey}" not found in ${this.normalizeFileName(fileName)}`,
      );
    }

    return fileData[scenarioKey];
  }

  /** Return any nested value from a JSON file using dot notation or an array path. */
  getValue<T>(fileName: string, jsonPath: JsonPath): T {
    const fileData = this.loadFile<unknown>(fileName);

    return this.resolvePathValue<T>(
      fileData,
      jsonPath,
      this.normalizeFileName(fileName),
    );
  }

  /** Return a nested value from a specific top-level scenario in a JSON file. */
  getScenarioValue<T>(
    fileName: string,
    scenarioKey: string,
    jsonPath: JsonPath,
  ): T {
    const scenarioData = this.getScenario<unknown>(fileName, scenarioKey);

    return this.resolvePathValue<T>(
      scenarioData,
      jsonPath,
      `${this.normalizeFileName(fileName)} -> ${scenarioKey}`,
    );
  }

  /** Return one test case object from a scenario that stores testCases as an array. */
  getScenarioTestCase<TTestCase extends { testCaseId: string }>(
    fileName: string,
    scenarioKey: string,
    testCaseId: string,
  ): TTestCase {
    const scenarioData = this.getScenario<{ testCases: TTestCase[] }>(
      fileName,
      scenarioKey,
    );

    if (!Array.isArray(scenarioData.testCases)) {
      throw new Error(
        `[JsonTestDataReader] Scenario "${scenarioKey}" in ${this.normalizeFileName(fileName)} does not contain a testCases array`,
      );
    }

    const matchingTestCase = scenarioData.testCases.find(
      (currentTestCase) => currentTestCase.testCaseId === testCaseId,
    );

    if (!matchingTestCase) {
      throw new Error(
        `[JsonTestDataReader] Test case "${testCaseId}" not found in ${this.normalizeFileName(fileName)} -> ${scenarioKey}`,
      );
    }

    return matchingTestCase;
  }

  /** Return the testData block for one test case in a scenario. */
  getScenarioTestCaseData<TTestCaseData>(
    fileName: string,
    scenarioKey: string,
    testCaseId: string,
  ): TTestCaseData {
    const testCase = this.getScenarioTestCase<TestCaseJsonData<TTestCaseData>>(
      fileName,
      scenarioKey,
      testCaseId,
    );

    return testCase.testData;
  }

  /** Clear the in-memory JSON cache for one file or for all loaded files. */
  clearCache(fileName?: string): void {
    if (!fileName) {
      this.cache.clear();
      return;
    }

    this.cache.delete(this.normalizeFileName(fileName));
  }

  private resolveBaseDirectory(): string {
    const candidateDirectories = [
      path.resolve(process.cwd(), 'test-data'),
      path.resolve(__dirname, '..', 'test-data'),
    ];

    const existingDirectory = candidateDirectories.find((directory) =>
      fs.existsSync(directory),
    );

    if (!existingDirectory) {
      throw new Error(
        '[JsonTestDataReader] Unable to locate the test-data directory.',
      );
    }

    return existingDirectory;
  }

  private normalizeFileName(fileName: string): string {
    return fileName.toLowerCase().endsWith('.json')
      ? fileName
      : `${fileName}.json`;
  }

  private parsePath(jsonPath: JsonPath): JsonPathSegment[] {
    if (Array.isArray(jsonPath)) {
      return [...jsonPath];
    }

    return jsonPath
      .split('.')
      .filter(Boolean)
      .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
  }

  private resolvePathValue<T>(
    source: unknown,
    jsonPath: JsonPath,
    context: string,
  ): T {
    const pathSegments = this.parsePath(jsonPath);
    let currentValue: unknown = source;

    for (const pathSegment of pathSegments) {
      if (typeof pathSegment === 'number') {
        if (!Array.isArray(currentValue) || pathSegment >= currentValue.length) {
          throw new Error(
            `[JsonTestDataReader] Path "${pathSegments.join('.')}" not found in ${context}`,
          );
        }

        currentValue = currentValue[pathSegment];
        continue;
      }

      if (!isRecord(currentValue) || !(pathSegment in currentValue)) {
        throw new Error(
          `[JsonTestDataReader] Path "${pathSegments.join('.')}" not found in ${context}`,
        );
      }

      currentValue = currentValue[pathSegment];
    }

    return currentValue as T;
  }
}

export const jsonTestDataReader = new JsonTestDataReader();

// ── Helper function to load JSON data ────────────────────────────────
function loadJsonData<T>(fileName: string): T {
  return jsonTestDataReader.loadFile<T>(fileName);
}

// ── Load test data from JSON files ───────────────────────────────────
const usersData = loadJsonData<Record<string, unknown>>('users.json');
const environmentsData = loadJsonData<Record<string, Record<string, string>>>(
  'environments.json',
);
const configData = loadJsonData<Record<string, unknown>>('config.json');
const testCasesData = loadJsonData<Record<string, unknown>>('testCases.json');

/** User credentials loaded from test-data/users.json */
export const TEST_USERS = usersData;

/** Environment configurations loaded from test-data/environments.json */
export const ENVIRONMENTS = environmentsData;

/** Global configuration loaded from test-data/config.json */
export const GLOBAL_CONFIG = configData;

/** Test case data loaded from test-data/testCases.json */
export const TEST_CASES = testCasesData;

/** Configuration values based on current environment */
const currentEnv = (process.env.ENVIRONMENT || 'qa').toLowerCase();
const envConfig = ENVIRONMENTS[currentEnv] || ENVIRONMENTS.qa;

export const CONFIG = {
  BACKOFFICE_LOGIN_URL: envConfig.backofficeLoginUrl,
  BACKOFFICE_DASHBOARD_URL: envConfig.backofficeUrlDashboard,
} as const;

/** Re-export the database reader for tests that need dynamic queries */
export { databaseReader };

/**
 * Convenience helpers for specs that prefer function-style JSON access.
 */
export function getJsonTestData<T>(fileName: string): T {
  return jsonTestDataReader.loadFile<T>(fileName);
}

export function getScenarioTestData<T>(
  fileName: string,
  scenarioKey: string,
): T {
  return jsonTestDataReader.getScenario<T>(fileName, scenarioKey);
}

export function getScenarioTestDataValue<T>(
  fileName: string,
  scenarioKey: string,
  jsonPath: JsonPath,
): T {
  return jsonTestDataReader.getScenarioValue<T>(fileName, scenarioKey, jsonPath);
}

export function getScenarioTestCase<TTestCase extends { testCaseId: string }>(
  fileName: string,
  scenarioKey: string,
  testCaseId: string,
): TTestCase {
  return jsonTestDataReader.getScenarioTestCase<TTestCase>(
    fileName,
    scenarioKey,
    testCaseId,
  );
}

export function getScenarioTestCaseData<T>(
  fileName: string,
  scenarioKey: string,
  testCaseId: string,
): T {
  return jsonTestDataReader.getScenarioTestCaseData<T>(
    fileName,
    scenarioKey,
    testCaseId,
  );
}
