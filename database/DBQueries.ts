/**
 * Database Queries
 * ================
 * Central place for SQL used by the framework. Keeping SQL here (instead of
 * inline in tests or the repository) makes queries easy to find, review and
 * reuse.
 *
 * Table/column names below are confirmed against the Stage schema (public
 * schema: store, employee, item, etc.).
 */

export const DBQueries = {
  getStoreById: `
    SELECT store_id, code, name, address, phone, region, active,
           hierarchy_node_id, store_type, timezone, ims_enabled, ims_enabled_on
    FROM store
    WHERE store_id = $1
  `,

  getUserByRole: `
    SELECT employee_id, store_id, first_name, last_name, role, active, email
    FROM employee
    WHERE role = $1 AND active = true
    LIMIT 1
  `,

  getActiveInventoryItemsByStore: `
    SELECT si.store_id, i.item_id, i.sku, i.name, i.is_active
    FROM store_item si
    INNER JOIN item i ON i.item_id = si.item_id
    WHERE si.store_id = $1 AND i.is_active = true
    ORDER BY i.name
  `,
};

