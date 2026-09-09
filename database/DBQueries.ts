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

  getStoreByName: `
    SELECT store_id, code, name, region, active
    FROM store
    WHERE name = $1 AND active = true
    LIMIT 1
  `,

  getPositiveWasteableIngredient: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON s.item_id = i.item_id
    JOIN public.store st ON st.store_id = s.store_id
    WHERE st.name = $1
      AND s.qty_on_hand > 1
      AND i.item_type = 'ingredient'
      AND i.is_wasteable = true
    ORDER BY s.stock_id ASC
    LIMIT 1
  `,

  getZeroStockWasteableIngredient: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON s.item_id = i.item_id
    JOIN public.store st ON st.store_id = s.store_id
    WHERE st.name = $1
      AND s.qty_on_hand < 1
      AND i.item_type = 'ingredient'
      AND i.is_wasteable = true
    ORDER BY s.stock_id ASC
    LIMIT 1
  `,

  getZeroStockWasteableIngredientByStoreId: `
    SELECT i.sku
    FROM public.stock s
    JOIN public.item i
      ON s.item_id = i.item_id
    WHERE s.store_id = $1
      AND s.qty_on_hand < 1
      AND i.item_type = 'ingredient'
      AND i.is_wasteable = true
    ORDER BY s.stock_id ASC
    LIMIT 1
  `,

  getEligibleWasteableIngredients: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON s.item_id = i.item_id
    JOIN public.store st ON st.store_id = s.store_id
    WHERE st.name = $1
      AND s.qty_on_hand > 1
      AND i.item_type = 'ingredient'
      AND i.is_wasteable = true
    ORDER BY s.stock_id ASC
  `,

  getAlternateActiveStore: `
    SELECT store_id, code, name, region, active
    FROM store
    WHERE active = true AND name <> $1
    ORDER BY store_id
    LIMIT 1
  `,

  getActiveRecipe: `
    SELECT r.recipe_id, r.name, r.yield_uom_id, u.abbreviation AS uom
    FROM public.recipe r
    LEFT JOIN public.uom u ON u.uom_id = r.yield_uom_id
    WHERE r.name IS NOT NULL
      AND (r.effective_from IS NULL OR r.effective_from <= CURRENT_DATE)
      AND (r.effective_to IS NULL OR r.effective_to >= CURRENT_DATE)
    ORDER BY r.recipe_id
    LIMIT 1
  `,

  getWasteReason: `
    SELECT reason_id, code, description
    FROM public.waste_reason
    WHERE description = $1 AND active = true
    LIMIT 1
  `,

  getFirstActiveWasteReason: `
    SELECT reason_id, code, description
    FROM public.waste_reason
    WHERE active = true
    ORDER BY reason_id
    LIMIT 1
  `,

  getUomByAbbreviation: `
    SELECT uom_id, name, abbreviation
    FROM public.uom
    WHERE abbreviation = $1
    LIMIT 1
  `,
};

