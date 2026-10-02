export const OrderingQueries = {
  getDraftPurchaseOrderLinesWithCategories: `
    SELECT
      po.po_id,
      CONCAT('PO-', po.po_id::text) AS po_number,
      pol.item_id,
      i.sku,
      i.name AS item_name,
      ic.name AS category,
      pol.ordered_qty
    FROM public.purchase_order_line pol
    JOIN public.purchase_order po ON po.po_id = pol.po_id
    JOIN public.item i ON i.item_id = pol.item_id
    LEFT JOIN public.item_category ic ON ic.category_id = i.category_id
    WHERE pol.po_id = (
      SELECT pol2.po_id
      FROM public.purchase_order_line pol2
      JOIN public.purchase_order po ON po.po_id = pol2.po_id
      WHERE po.store_id = $1
        AND po.status = 'draft'
      GROUP BY pol2.po_id
      ORDER BY COUNT(pol2.item_id) DESC
      LIMIT 1
    )
    ORDER BY pol.item_id
  `,

  hasPurchaseOrderTypeColumn: `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'purchase_order'
        AND column_name = 'order_type'
    ) AS exists
  `,

  getDistinctPurchaseOrderTypes: `
    SELECT DISTINCT order_type
    FROM public.purchase_order
    WHERE order_type IS NOT NULL
    ORDER BY order_type
  `,

  getUniqueSaleData: `
    SELECT
        COALESCE(MAX(order_number::bigint), 0) + 1 AS new_order_number,
        gen_random_uuid()::text AS new_external_id
    FROM public.sale
    WHERE store_id = $1
  `,
};
