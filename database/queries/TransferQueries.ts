export const TransferQueries = {
  getTransferableZeroStockIngredientByStoreId: `
    SELECT i.item_id, i.sku, i.name, s.store_id, s.qty_on_hand
    FROM public.stock AS s
    JOIN public.item AS i ON s.item_id = i.item_id
    WHERE s.store_id = $1
      AND s.qty_on_hand < 1
      AND i.item_type = 'ingredient'
      AND i.is_transferable = true
    ORDER BY s.stock_id ASC
    LIMIT 1
  `,

  getTransferableZeroStockIngredientSkuByStoreId: `
    SELECT i.sku
    FROM public.stock AS s
    JOIN public.item AS i
        ON s.item_id = i.item_id
    WHERE s.store_id = $1
      AND s.qty_on_hand < 1
      AND i.item_type = 'ingredient'
      AND i.is_transferable = true
    ORDER BY s.stock_id ASC
    LIMIT 1
  `,

  getTransferReasonByCode: `
    SELECT reason_id, code, description, active
    FROM public.stock_transfer_reason
    WHERE code = $1 AND active = true
    LIMIT 1
  `,
};
