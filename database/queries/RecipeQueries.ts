export const RecipeQueries = {
  getRecipeNameAndSkuForWaste: `
        SELECT DISTINCT r.recipe_id, r.name AS recipe_name, i.sku, u.abbreviation AS uom,
          to_jsonb(ri) AS recipe_ingredient_data
    FROM public.recipe r
    JOIN public.recipe_ingredient ri ON ri.recipe_id = r.recipe_id
    JOIN public.item i ON i.item_id = ri.item_id
    JOIN public.master m ON m.item_id = ri.item_id
    LEFT JOIN public.uom u ON u.uom_id = r.yield_uom_id
    WHERE r.name = (
      SELECT DISTINCT r2.name
      FROM public.recipe r2
      JOIN public.recipe_ingredient ri2 ON ri2.recipe_id = r2.recipe_id
      JOIN public.master m2 ON m2.item_id = ri2.item_id
      ORDER BY r2.name
      LIMIT 1
    )
    ORDER BY r.name, i.sku
    LIMIT 1
  `,

  getLatestRecipeIngredientStockByParentSku: `
    SELECT i.sku, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.sku = (
      SELECT ingredient.sku
      FROM public.item_lot il
      JOIN public.item lot_item ON lot_item.item_id = il.item_id
      JOIN public.item parent ON parent.sku = $1
      JOIN public.master m ON m.item_id = parent.item_id
      JOIN public.master_ingredient mi ON mi.master_id = m.master_id
      JOIN public.item ingredient ON ingredient.item_id = mi.item_id
      WHERE il.item_id = ingredient.item_id
      ORDER BY il.qty_remaining DESC, il.created_at DESC
      LIMIT 1
    )
    ORDER BY s.updated_at DESC
    LIMIT 1
  `,

  getMasterStockBySku: `
    SELECT i.sku, s.qty_on_hand
    FROM public.stock s
    JOIN public.item i ON i.item_id = s.item_id
    WHERE i.sku = $1
    ORDER BY s.updated_at DESC
    LIMIT 1
  `,

  getChildLotsByParentSku: `
    SELECT ingredient.sku, s.qty_on_hand, il.qty_remaining, il.created_at
    FROM public.item parent
    JOIN public.master m ON m.item_id = parent.item_id
    JOIN public.master_ingredient mi ON mi.master_id = m.master_id
    JOIN public.item ingredient ON ingredient.item_id = mi.item_id
    JOIN public.item_lot il ON il.item_id = ingredient.item_id
    JOIN public.stock s ON s.item_id = ingredient.item_id AND s.store_id = $2
    WHERE parent.sku = $1
      AND il.qty_remaining > 0
      AND s.qty_on_hand > 0
    ORDER BY il.created_at ASC, il.qty_remaining DESC
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
};
