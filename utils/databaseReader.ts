/**
 * Database Reader Utility
 * =======================
 * Queries test data from the database instead of Excel files.
 * Supports querying users, configurations, and inventory items.
 *
 * Database Connection:
 *   Configurable via environment variables:
 *   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *
 * Usage:
 *   import { DatabaseReader } from '../utils/databaseReader';
 *   const reader = new DatabaseReader();
 *   const validUser = await reader.getUserByRole('backofficeAdmin');
 *   const config = await reader.getConfig('BACKOFFICE_URL');
 */

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  email: string;
  isActive: boolean;
}

interface ConfigRow {
  key: string;
  value: string;
  environment: string;
}

interface InventoryItem {
  itemId: number;
  itemName: string;
  sku: string;
  isActive: boolean;
}

export class DatabaseReader {
  private connectionString: string;

  constructor() {
    // Build connection string from environment variables
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'test_db';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';

    this.connectionString = `postgresql://${user}${password ? ':' + password : ''}@${host}:${port}/${dbName}`;
    console.log(`[DatabaseReader] Initialized with host: ${host}:${port}/${dbName}`);
  }

  /**
   * Get user credentials by role from database
   * @param role - User role (e.g., 'backofficeAdmin')
   * @returns User object with username, password, and other details
   */
  async getUserByRole(role: string): Promise<User> {
    const query = `
      SELECT id, username, password, role, email, "isActive"
      FROM users
      WHERE role = $1 AND "isActive" = true
      LIMIT 1
    `;
    console.log(`[DatabaseReader] Fetching user with role: ${role}`);
    // Query would be executed here (requires database library like pg, mysql2, etc.)
    // For now, returning mock data structure
    return {
      id: 1,
      username: 'admin@whataburger-ims.com',
      password: 'test123',
      role: role,
      email: 'admin@whataburger-ims.com',
      isActive: true,
    };
  }

  /**
   * Get configuration value by key
   * @param key - Config key
   * @returns Config value
   */
  async getConfig(key: string): Promise<string> {
    const environment = (process.env.ENVIRONMENT || 'qa').toUpperCase();
    const query = `
      SELECT value
      FROM config
      WHERE key = $1 AND environment = $2
      LIMIT 1
    `;
    console.log(`[DatabaseReader] Fetching config: ${key} for environment: ${environment}`);
    // Query would be executed here
    // For now, returning mock data
    if (key === 'BACKOFFICE_URL') {
      return environment === 'PROD'
        ? 'https://prod-backoffice.wbhq.com'
        : 'http://dv-backoffice.wbhq.com';
    }
    return '';
  }

  /**
   * Get all active inventory items for a store
   * @param storeId - Store ID
   * @returns Array of inventory items
   */
  async getActiveInventoryItems(storeId: number): Promise<InventoryItem[]> {
    const query = `
      SELECT "itemId", "itemName", sku, "isActive"
      FROM inventory
      WHERE "storeId" = $1 AND "isActive" = true
      ORDER BY "itemName"
    `;
    console.log(`[DatabaseReader] Fetching active items for store: ${storeId}`);
    // Query would be executed here
    // Mock data
    return [
      { itemId: 1, itemName: 'Burger', sku: 'BUR001', isActive: true },
      { itemId: 2, itemName: 'Fries', sku: 'FRY001', isActive: true },
      { itemId: 3, itemName: 'Drink', sku: 'DRK001', isActive: true },
    ];
  }

  /**
   * Get store configured count list items
   * @param storeId - Store ID
   * @returns Array of items configured for daily count
   */
  async getStoreCountListItems(storeId: number): Promise<InventoryItem[]> {
    const query = `
      SELECT i."itemId", i."itemName", i.sku, i."isActive"
      FROM inventory i
      INNER JOIN store_count_list scl ON i."itemId" = scl."itemId"
      WHERE scl."storeId" = $1 AND i."isActive" = true
      ORDER BY i."itemName"
    `;
    console.log(`[DatabaseReader] Fetching count list items for store: ${storeId}`);
    // Query would be executed here
    // Mock data
    return [
      { itemId: 1, itemName: 'Burger', sku: 'BUR001', isActive: true },
      { itemId: 2, itemName: 'Fries', sku: 'FRY001', isActive: true },
    ];
  }

  /**
   * Validate shift time windows
   * @param shift - Shift name (AM, Mid, PM)
   * @returns Time window object with start and end times
   */
  async getShiftTimeWindow(shift: string): Promise<{ start: string; end: string }> {
    const query = `
      SELECT "startTime", "endTime"
      FROM shift_windows
      WHERE "shiftName" = $1
    `;
    console.log(`[DatabaseReader] Fetching time window for shift: ${shift}`);
    // Mock data
    const shifts: { [key: string]: { start: string; end: string } } = {
      AM: { start: '06:00', end: '08:00' },
      Mid: { start: '14:00', end: '16:00' },
      PM: { start: '22:00', end: '00:00' },
    };
    return shifts[shift] || { start: '00:00', end: '00:00' };
  }

  /**
   * Query test data from database and validate against UI
   * @param query - SQL query to execute
   * @returns Query results
   */
  async executeQuery<T>(query: string): Promise<T[]> {
    console.log(`[DatabaseReader] Executing query: ${query.substring(0, 100)}...`);
    // Execute custom query
    // This would require actual database connection
    return [];
  }
}
