export const VendorItemQueries = {
  /** All vendor-item records (unfiltered) for a given vendor. Used for RCSP-283 UI vs DB comparisons. */
  getVendorItemsByVendorId: `
    SELECT
      i.item_id,
      i.sku,
      vi.vendor_item_id,
      vi.vendor_id,
      vi.vendor_sku,
      vi.vendor_item_name,
      vi.unit_cost,
      vi.available_from,
      vi.expires_at
    FROM public.item i
    INNER JOIN public.vendor_item vi ON i.item_id = vi.item_id
    WHERE vi.vendor_id = $1
    ORDER BY i.item_id
  `,

  /** Latest applicable vendor-item record per item_id for a given vendor (available_from DESC), excluding null available_from/expires_at. */
  getLatestVendorItemsByVendorId: `
    SELECT DISTINCT ON (i.item_id)
      i.item_id,
      i.sku,
      vi.vendor_item_id,
      vi.vendor_id,
      vi.vendor_sku,
      vi.vendor_item_name,
      vi.unit_cost,
      vi.available_from,
      vi.expires_at
    FROM public.item i
    INNER JOIN public.vendor_item vi ON i.item_id = vi.item_id
    WHERE vi.vendor_id = $1
      AND vi.available_from IS NOT NULL
      AND vi.expires_at IS NOT NULL
    ORDER BY i.item_id, vi.available_from DESC
  `,
};
