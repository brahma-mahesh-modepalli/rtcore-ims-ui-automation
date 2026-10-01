export const OrderingQueries = {
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
