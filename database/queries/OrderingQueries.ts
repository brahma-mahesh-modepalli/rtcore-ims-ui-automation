export const OrderingQueries = {
  getVendorDeliveryDatesForCurrentWeek: `
    SELECT TO_CHAR(delivery_date, 'DD/MM/YYYY') AS delivery_date
    FROM public.delivery_date
    WHERE store_id = $1
      AND vendor_id = $2
      AND delivery_date >= DATE_TRUNC('week', CURRENT_DATE)
      AND delivery_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
    ORDER BY delivery_date ASC
  `,

  getVendorDeliveryDatesOutsideCurrentWeek: `
    SELECT TO_CHAR(delivery_date, 'DD/MM/YYYY') AS delivery_date
    FROM public.delivery_date
    WHERE store_id = $1
      AND vendor_id = $2
      AND (
        delivery_date < DATE_TRUNC('week', CURRENT_DATE)
        OR delivery_date >= DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
      )
    ORDER BY delivery_date ASC
  `,

  getActiveOrderGuideItemsByStoreAndVendorName: `
    SELECT
      og.vendor_id,
      v.code AS vendor_code,
      v.name AS vendor_name,
      og.item_id,
      i.sku AS item_sku,
      i.name AS item_name
    FROM public.order_guide og
    JOIN public.vendor v ON og.vendor_id = v.vendor_id
    JOIN public.item i ON og.item_id = i.item_id
    WHERE og.store_id = $1
      AND og.active = true
      AND v.active = true
      AND v.name = $2
    ORDER BY i.name
  `,

  getApprovedPurchaseOrdersWithTruckDeliveries: `
    SELECT DISTINCT
      po.po_id,
      td.truck_number
    FROM public.purchase_order po
    JOIN public.truck_delivery td ON td.po_id = po.po_id
    WHERE po.store_id = $1
      AND po.status = 'approved'
    ORDER BY po.po_id DESC
  `,

  getPurchaseOrderLinesByPoId: `
    SELECT po_id
    FROM public.purchase_order_line
    WHERE po_id = $1
    ORDER BY po_id
  `,

  getNextNonExistingPurchaseOrderId: `
    SELECT COALESCE(MAX(po_id), 0) + 1 AS invalid_po_id
    FROM public.purchase_order
  `,

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
