/**
 * Test Data Repository
 * ====================
 * The single bridge between Playwright tests and PostgreSQL. Tests call
 * methods on this class and never touch SQL, connection details, or
 * credentials directly.
 *
 *   Playwright Test -> TestDataRepository -> domain query class -> DBConnection -> PostgreSQL
 *
 * This coexists with (and does not replace) the existing JSON test-data
 * mechanism in utils/testData.ts.
 */

import { DBConnection } from '../database/DBConnection';
import {
  InventoryQueries,
  CreditRequestQueries,
  OrderingQueries,
  RecipeQueries,
  StoreQueries,
  TransferQueries,
  UomQueries,
  UserQueries,
  VendorItemQueries,
  WastageQueries,
} from '../database/DBQueries';
import { Reporting } from '../reporting/Reporting';

export interface StoreData {
  store_id: number;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  region: string | null;
  active: boolean;
  hierarchy_node_id: number | null;
  store_type: string | null;
  timezone: string | null;
  ims_enabled: boolean;
  ims_enabled_on: string | null;
}

export interface UserData {
  employee_id: number;
  store_id: number;
  first_name: string;
  last_name: string;
  role: string;
  active: boolean;
  email: string | null;
}

export interface InventoryItemData {
  store_id: number;
  item_id: number;
  sku: string;
  name: string;
  is_active: boolean;
}

export interface StoreLookupData {
  store_id: number;
  code: string | null;
  name: string;
  region: string | null;
  active: boolean;
  ims_enabled?: boolean;
}

export interface WasteableIngredientData {
  item_id: number;
  sku: string;
  name: string;
  store_id: number;
  qty_on_hand: number;
}

export interface TransferableIngredientSkuData {
  sku: string;
}

export interface WasteableIngredientSkuData {
  sku: string;
}

export interface WasteableStockSkuData extends WasteableIngredientSkuData {
  qty_on_hand: number;
}

export interface WasteableItemOtherStoreData extends WasteableIngredientData {
  source_store_id: number;
  source_qty_on_hand: number;
}

export interface StoreStockData {
  store_id: number;
  qty_on_hand: number;
}

export interface RecipeData {
  recipe_id: number;
  name: string;
  yield_uom_id: number | null;
  uom: string | null;
}

export interface RecipeSkuData {
  recipe_id: number;
  recipe_name: string;
  sku: string;
  uom: string | null;
  recipe_ingredient_data: Record<string, unknown>;
}

export interface RecipeIngredientStockData {
  sku: string;
  qty_on_hand: number;
}

export interface RecipeChildLotStockData extends RecipeIngredientStockData {
  qty_remaining: number;
  created_at: string;
}

export interface WasteReasonData {
  reason_id: number;
  code: string;
  description: string;
}

export interface UomData {
  uom_id: number;
  name: string;
  abbreviation: string;
}

export interface TransferReasonData {
  reason_id: number;
  code: string;
  description: string;
  active: boolean;
}

export interface VendorItemData {
  item_id: number;
  sku: string;
  vendor_item_id: number;
  vendor_id: number;
  vendor_sku: string | null;
  vendor_item_name: string;
  unit_cost: string;
  available_from: string | null;
  expires_at: string | null;
}

export interface SaleData {
  new_order_number: number | string;
  new_external_id: string;
}

export interface PurchaseOrderTypeData {
  order_type: string;
}

export interface PurchaseOrderTypeColumnData {
  exists: boolean;
}

export interface VendorNameData {
  name: string;
}

export interface EligibleCreditRequestPoData {
  po_id: string;
}

export interface PurchaseOrderTypeData {
  order_type: string;
}

export interface PurchaseOrderTypeColumnData {
  exists: boolean;
}

export interface VendorNameData {
  name: string;
}

export class TestDataRepository {
  /** Fetch a single store by its id. Returns undefined if no row is found. */
  async getStoreById(storeId: number): Promise<StoreData | undefined> {
    try {
      const rows = await DBConnection.executeQuery<StoreData>(
        StoreQueries.getStoreById,
        [storeId],
      );
      return rows[0];
    } catch (error) {
      Reporting.error(
        `Database query failed. Query name: getStoreById. Environment: ${
          process.env.ENVIRONMENT || 'stage'
        }. Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /** Fetch a single active user by role. Returns undefined if no row is found. */
  async getUserByRole(role: string): Promise<UserData | undefined> {
    try {
      const rows = await DBConnection.executeQuery<UserData>(
        UserQueries.getUserByRole,
        [role],
      );
      return rows[0];
    } catch (error) {
      Reporting.error(
        `Database query failed. Query name: getUserByRole. Environment: ${
          process.env.ENVIRONMENT || 'stage'
        }. Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /** Fetch all active inventory items for a given store. */
  async getActiveInventoryItemsByStore(
    storeId: number,
  ): Promise<InventoryItemData[]> {
    try {
      return await DBConnection.executeQuery<InventoryItemData>(
        InventoryQueries.getActiveInventoryItemsByStore,
        [storeId],
      );
    } catch (error) {
      Reporting.error(
        `Database query failed. Query name: getActiveInventoryItemsByStore. ` +
          `Environment: ${process.env.ENVIRONMENT || 'stage'}. Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
      );
      throw error;
    }
  }

  async getStoreByName(name: string): Promise<StoreLookupData | undefined> {
    return (await DBConnection.executeQuery<StoreLookupData>(StoreQueries.getStoreByName, [name]))[0];
  }

  async getTransferableZeroStockIngredientByStoreId(
    storeId: number,
  ): Promise<WasteableIngredientData | undefined> {
    return (
      await DBConnection.executeQuery<WasteableIngredientData>(
        TransferQueries.getTransferableZeroStockIngredientByStoreId,
        [storeId],
      )
    )[0];
  }

  async getTransferableZeroStockIngredientSkuByStoreId(
    storeId: number,
  ): Promise<string | undefined> {
    const rows = await DBConnection.executeQuery<TransferableIngredientSkuData>(
      TransferQueries.getTransferableZeroStockIngredientSkuByStoreId,
      [storeId],
    );
    return rows[0]?.sku;
  }

  async getTransferableIngredientWithStockByStoreId(
    storeId: number,
  ): Promise<WasteableIngredientData | undefined> {
    return (
      await DBConnection.executeQuery<WasteableIngredientData>(
        TransferQueries.getTransferableIngredientWithStockByStoreId,
        [storeId],
      )
    )[0];
  }

  async getTransferReasonByCode(
    code: string,
  ): Promise<TransferReasonData | undefined> {
    return (
      await DBConnection.executeQuery<TransferReasonData>(
        TransferQueries.getTransferReasonByCode,
        [code],
      )
    )[0];
  }

  async getPositiveWasteableIngredient(storeId: number): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getPositiveWasteableIngredient,
      [storeId],
    ))[0];
  }

  async getWasteableItemWithPositiveStockByStoreId(storeId: number): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getWasteableItemWithPositiveStockByStoreId,
      [storeId],
    ))[0];
  }

  async getWasteableItemWithOneStockByStoreId(storeId: number): Promise<WasteableStockSkuData | undefined> {
    return (await DBConnection.executeQuery<WasteableStockSkuData>(
      InventoryQueries.getWasteableItemWithOneStockByStoreId,
      [storeId],
    ))[0];
  }

  async getWasteableItemWithZeroStockByStoreId(storeId: number): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getWasteableItemWithZeroStockByStoreId,
      [storeId],
    ))[0];
  }

  async getWasteableItemWithNegativeStockByStoreId(storeId: number): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getWasteableItemWithNegativeStockByStoreId,
      [storeId],
    ))[0];
  }

  async getNonWasteableItemWithPositiveStockByStoreId(storeId: number): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getNonWasteableItemWithPositiveStockByStoreId,
      [storeId],
    ))[0];
  }

  async getWasteableItemPositiveElsewhereAndZeroHere(storeId: number): Promise<WasteableItemOtherStoreData | undefined> {
    return (await DBConnection.executeQuery<WasteableItemOtherStoreData>(
      InventoryQueries.getWasteableItemPositiveElsewhereAndZeroHere,
      [storeId],
    ))[0];
  }

  async getTransferableStockForSkuOutsideStore(sku: string, storeId: number): Promise<StoreStockData | undefined> {
    return (await DBConnection.executeQuery<StoreStockData>(
      InventoryQueries.getTransferableStockForSkuOutsideStore,
      [sku, storeId],
    ))[0];
  }

  async getWasteableStockBySkuAndStore(sku: string, storeId: number): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getWasteableStockBySkuAndStore,
      [sku, storeId],
    ))[0];
  }

  async getZeroStockWasteableIngredient(storeId: number): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getZeroStockWasteableIngredient,
      [storeId],
    ))[0];
  }

  async getZeroStockWasteableIngredientSkuByStoreId(
    storeId: number,
  ): Promise<string | undefined> {
    const rows = await DBConnection.executeQuery<WasteableIngredientSkuData>(
      InventoryQueries.getZeroStockWasteableIngredientByStoreId,
      [storeId],
    );
    return rows[0]?.sku;
  }

  async getEligibleWasteableIngredients(storeId: number): Promise<WasteableIngredientData[]> {
    return DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getEligibleWasteableIngredients,
      [storeId],
    );
  }

  async getAlternateActiveStore(excludedStoreName: string): Promise<StoreLookupData | undefined> {
    return (await DBConnection.executeQuery<StoreLookupData>(
      StoreQueries.getAlternateActiveStore,
      [excludedStoreName],
    ))[0];
  }

  async getActiveRecipe(): Promise<RecipeData | undefined> {
    return (await DBConnection.executeQuery<RecipeData>(RecipeQueries.getActiveRecipe))[0];
  }

  async getRecipeNameAndSkuForWaste(): Promise<RecipeSkuData | undefined> {
    return (await DBConnection.executeQuery<RecipeSkuData>(
      RecipeQueries.getRecipeNameAndSkuForWaste,
    ))[0];
  }

  async getLatestRecipeIngredientStockByParentSku(
    parentSku: string,
  ): Promise<RecipeIngredientStockData | undefined> {
    return (await DBConnection.executeQuery<RecipeIngredientStockData>(
      RecipeQueries.getLatestRecipeIngredientStockByParentSku,
      [parentSku],
    ))[0];
  }

  async getStockBySku(sku: string): Promise<RecipeIngredientStockData | undefined> {
    return (await DBConnection.executeQuery<RecipeIngredientStockData>(
      RecipeQueries.getMasterStockBySku,
      [sku],
    ))[0];
  }

  async getChildLotsByParentSku(
    parentSku: string,
    storeId: number,
  ): Promise<RecipeChildLotStockData[]> {
    return DBConnection.executeQuery<RecipeChildLotStockData>(
      RecipeQueries.getChildLotsByParentSku,
      [parentSku, storeId],
    );
  }

  async getWasteReason(description: string): Promise<WasteReasonData | undefined> {
    return (await DBConnection.executeQuery<WasteReasonData>(WastageQueries.getWasteReason, [description]))[0];
  }

  async getFirstActiveWasteReason(): Promise<WasteReasonData | undefined> {
    return (await DBConnection.executeQuery<WasteReasonData>(WastageQueries.getFirstActiveWasteReason))[0];
  }

  async getUomByAbbreviation(abbreviation: string): Promise<UomData | undefined> {
    return (await DBConnection.executeQuery<UomData>(UomQueries.getUomByAbbreviation, [abbreviation]))[0];
  }

  /** Return a unique next order number and external id for a store so a Xenial sale can be posted. */
  async getUniqueSaleData(storeId: number): Promise<SaleData | undefined> {
    try {
      const rows = await DBConnection.executeQuery<SaleData>(
        OrderingQueries.getUniqueSaleData,
        [storeId],
      );
      const row = rows[0];
      if (!row) {
        return undefined;
      }

      return {
        ...row,
        new_order_number: Number(row.new_order_number),
      };
    } catch (error) {
      Reporting.error(
        `Database query failed. Query name: getUniqueSaleData. Environment: ${
          process.env.ENVIRONMENT || 'stage'
        }. Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async hasPurchaseOrderTypeColumn(): Promise<boolean> {
    const row = (await DBConnection.executeQuery<PurchaseOrderTypeColumnData>(
      OrderingQueries.hasPurchaseOrderTypeColumn,
    ))[0];
    return row?.exists ?? false;
  }

  async getDistinctPurchaseOrderTypes(): Promise<string[]> {
    const rows = await DBConnection.executeQuery<PurchaseOrderTypeData>(
      OrderingQueries.getDistinctPurchaseOrderTypes,
    );
    return rows.map((row) => row.order_type);
  }

  async getOrderingAllowedVendorNames(): Promise<string[]> {
    const rows = await DBConnection.executeQuery<VendorNameData>(
      VendorItemQueries.getOrderingAllowedVendorNames,
    );
    return rows.map((row) => row.name);
  }

  async getEligibleCreditRequestPurchaseOrderIds(): Promise<string[]> {
    const rows = await DBConnection.executeQuery<EligibleCreditRequestPoData>(
      CreditRequestQueries.getEligiblePurchaseOrderIds,
    );
    return rows.map((row) => String(row.po_id)).filter(Boolean);
  }

  /** All vendor-item records (unfiltered) for a given vendor. Used for RCSP-283. */
  async getVendorItemsByVendorId(vendorId: number): Promise<VendorItemData[]> {
    try {
      return await DBConnection.executeQuery<VendorItemData>(
        VendorItemQueries.getVendorItemsByVendorId,
        [vendorId],
      );
    } catch (error) {
      Reporting.error(
        `Database query failed. Query name: getVendorItemsByVendorId. Environment: ${
          process.env.ENVIRONMENT || 'stage'
        }. Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /** Latest applicable vendor-item record per item_id for a given vendor. Used for RCSP-283. */
  async getLatestVendorItemsByVendorId(vendorId: number): Promise<VendorItemData[]> {
    try {
      return await DBConnection.executeQuery<VendorItemData>(
        VendorItemQueries.getLatestVendorItemsByVendorId,
        [vendorId],
      );
    } catch (error) {
      Reporting.error(
        `Database query failed. Query name: getLatestVendorItemsByVendorId. Environment: ${
          process.env.ENVIRONMENT || 'stage'
        }. Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
