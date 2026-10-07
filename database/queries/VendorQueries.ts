export const VendorQueries = {
  getVendorsWithParent: `
    SELECT
      child.vendor_id AS id,
      child.code,
      child.name,
      child.parent_vendor_id,
      parent.code AS parent_code,
      parent.name AS parent_name,
      parent.parent_vendor_id AS parent_parent_vendor_id
    FROM public.vendor child
    JOIN public.vendor parent ON parent.vendor_id = child.parent_vendor_id
    ORDER BY child.code
  `,

  getStandaloneVendors: `
    SELECT
      vendor.vendor_id AS id,
      vendor.code,
      vendor.name,
      vendor.parent_vendor_id,
      NULL::text AS parent_code,
      NULL::text AS parent_name,
      NULL::integer AS parent_parent_vendor_id
    FROM public.vendor vendor
    WHERE vendor.parent_vendor_id IS NULL
    ORDER BY vendor.code
  `,

  getAnyVendor: `
    SELECT
      vendor.vendor_id AS id,
      vendor.code,
      vendor.name,
      vendor.parent_vendor_id,
      parent.code AS parent_code,
      parent.name AS parent_name,
      parent.parent_vendor_id AS parent_parent_vendor_id
    FROM public.vendor vendor
    LEFT JOIN public.vendor parent ON parent.vendor_id = vendor.parent_vendor_id
    ORDER BY vendor.code
    LIMIT 1
  `,

  getVendorByCode: `
    SELECT
      vendor.vendor_id AS id,
      vendor.code,
      vendor.name,
      vendor.parent_vendor_id,
      parent.code AS parent_code,
      parent.name AS parent_name,
      parent.parent_vendor_id AS parent_parent_vendor_id
    FROM public.vendor vendor
    LEFT JOIN public.vendor parent ON parent.vendor_id = vendor.parent_vendor_id
    WHERE vendor.code = $1
    LIMIT 1
  `,

  getMcLaneVendorHierarchy: `
    SELECT
      parent.vendor_id AS parent_id,
      parent.code AS parent_code,
      parent.name AS parent_name,
      child.vendor_id AS child_id,
      child.code AS child_code,
      child.name AS child_name
    FROM public.vendor parent
    LEFT JOIN public.vendor child ON child.parent_vendor_id = parent.vendor_id
    WHERE parent.parent_vendor_id IS NULL
      AND parent.name ILIKE $1
    ORDER BY child.code
  `,

  getPurchaseOrderById: `
    SELECT po.po_id, po.store_id, po.vendor_id
    FROM public.purchase_order po
    WHERE po.po_id = $1
    LIMIT 1
  `,

  getPurchaseOrderIdsForStore: `
    SELECT po.po_id
    FROM public.purchase_order po
    WHERE po.store_id = $1
    ORDER BY po.po_id
  `,
};