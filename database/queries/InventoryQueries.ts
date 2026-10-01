export const InventoryQueries = {
  getWasteableItemWithPositiveStockByStoreId: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.is_wasteable = true
      AND s.store_id = $1
      AND s.qty_on_hand > 0
    ORDER BY i.sku
    LIMIT 1
  `,

  getWasteableItemWithOneStockByStoreId: `
    SELECT i.sku, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.is_wasteable = true
      AND s.store_id = $1
      AND s.qty_on_hand = 1
    LIMIT 1
  `,

  getWasteableItemWithZeroStockByStoreId: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.is_wasteable = true
      AND s.store_id = $1
      AND s.qty_on_hand = 0
    ORDER BY i.sku
    LIMIT 1
  `,

  getWasteableItemWithNegativeStockByStoreId: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.is_wasteable = true
      AND s.store_id = $1
      AND s.qty_on_hand < 0
    ORDER BY i.sku
    LIMIT 1
  `,

  getNonWasteableItemWithPositiveStockByStoreId: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.is_wasteable = false
      AND s.store_id = $1
      AND s.qty_on_hand > 0
    ORDER BY i.sku
    LIMIT 1
  `,

  getWasteableItemPositiveElsewhereAndZeroHere: `
    SELECT i.item_id, i.sku, i.name, other.store_id AS source_store_id,
           other.qty_on_hand AS source_qty_on_hand, $1::integer AS store_id,
           COALESCE(current_store.qty_on_hand, 0) AS qty_on_hand
    FROM public.stock other
    JOIN public.item i ON i.item_id = other.item_id
    LEFT JOIN public.stock current_store
      ON current_store.item_id = i.item_id AND current_store.store_id = $1
    WHERE i.is_wasteable = true
      AND other.store_id <> $1
      AND other.qty_on_hand > 0
      AND COALESCE(current_store.qty_on_hand, 0) <= 0
    ORDER BY i.sku, other.store_id
    LIMIT 1
  `,

  getTransferableStockForSkuOutsideStore: `
    SELECT s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.sku = $1
      AND i.is_transferable = true
      AND s.store_id <> $2
      AND s.qty_on_hand > 0
    ORDER BY s.qty_on_hand DESC, s.store_id
    LIMIT 1
  `,

  getWasteableStockBySkuAndStore: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.sku = $1 AND s.store_id = $2
    LIMIT 1
  `,

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
    WHERE s.store_id = $1
      AND s.qty_on_hand > 0
      AND i.item_type = 'ingredient'
      AND i.is_wasteable = true
    ORDER BY s.stock_id ASC
    LIMIT 1
  `,

  getZeroStockWasteableIngredient: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON s.item_id = i.item_id
    WHERE s.store_id = $1
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
    WHERE s.store_id = $1
      AND s.qty_on_hand > 1
      AND i.item_type = 'ingredient'
      AND i.is_wasteable = true
    ORDER BY s.stock_id ASC
  `,
};
