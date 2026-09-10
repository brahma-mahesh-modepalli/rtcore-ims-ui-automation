export const InventoryQueries = {
  getActiveInventoryItemsByStore: `
    SELECT si.store_id, i.item_id, i.sku, i.name, i.is_active
    FROM store_item si
    INNER JOIN item i ON i.item_id = si.item_id
    WHERE si.store_id = $1 AND i.is_active = true
    ORDER BY i.name
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
};
