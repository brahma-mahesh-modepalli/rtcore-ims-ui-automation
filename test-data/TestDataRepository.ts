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
  RecipeQueries,
  StoreQueries,
  TransferQueries,
  UomQueries,
  UserQueries,
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

export interface RecipeData {
  recipe_id: number;
  name: string;
  yield_uom_id: number | null;
  uom: string | null;
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

  async getPositiveWasteableIngredient(storeName: string): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getPositiveWasteableIngredient,
      [storeName],
    ))[0];
  }

  async getZeroStockWasteableIngredient(storeName: string): Promise<WasteableIngredientData | undefined> {
    return (await DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getZeroStockWasteableIngredient,
      [storeName],
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

  async getEligibleWasteableIngredients(storeName: string): Promise<WasteableIngredientData[]> {
    return DBConnection.executeQuery<WasteableIngredientData>(
      InventoryQueries.getEligibleWasteableIngredients,
      [storeName],
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

  async getWasteReason(description: string): Promise<WasteReasonData | undefined> {
    return (await DBConnection.executeQuery<WasteReasonData>(WastageQueries.getWasteReason, [description]))[0];
  }

  async getFirstActiveWasteReason(): Promise<WasteReasonData | undefined> {
    return (await DBConnection.executeQuery<WasteReasonData>(WastageQueries.getFirstActiveWasteReason))[0];
  }

  async getUomByAbbreviation(abbreviation: string): Promise<UomData | undefined> {
    return (await DBConnection.executeQuery<UomData>(UomQueries.getUomByAbbreviation, [abbreviation]))[0];
  }
}
