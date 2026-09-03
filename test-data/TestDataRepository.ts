/**
 * Test Data Repository
 * ====================
 * The single bridge between Playwright tests and PostgreSQL. Tests call
 * methods on this class and never touch SQL, connection details, or
 * credentials directly.
 *
 *   Playwright Test -> TestDataRepository -> DBQueries -> DBConnection -> PostgreSQL
 *
 * This coexists with (and does not replace) the existing JSON test-data
 * mechanism in utils/testData.ts.
 */

import { DBConnection } from '../database/DBConnection';
import { DBQueries } from '../database/DBQueries';
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

export class TestDataRepository {
  /** Fetch a single store by its id. Returns undefined if no row is found. */
  async getStoreById(storeId: number): Promise<StoreData | undefined> {
    try {
      const rows = await DBConnection.executeQuery<StoreData>(
        DBQueries.getStoreById,
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
        DBQueries.getUserByRole,
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
        DBQueries.getActiveInventoryItemsByStore,
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
}
