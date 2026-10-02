export const CreditRequestQueries = {
  getEligiblePurchaseOrderIds: `
    SELECT po_id
    FROM public.truck_delivery
    WHERE status = 'completed'
      AND vendor_id IN ('2', '3')
      AND po_id NOT IN (
        SELECT DISTINCT po_id
        FROM public.credit_memo
        WHERE po_id IS NOT NULL
      )
    ORDER BY arrived_at DESC
    LIMIT 25
  `,
};