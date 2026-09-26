export const OrderingQueries = {
  getUniqueSaleData: `
    SELECT
        COALESCE(MAX(order_number::bigint), 0) + 1 AS new_order_number,
        gen_random_uuid()::text AS new_external_id
    FROM public.sale
    WHERE store_id = $1
  `,
};
