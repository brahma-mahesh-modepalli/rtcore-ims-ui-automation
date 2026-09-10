export const StoreQueries = {
  getStoreById: `
    SELECT store_id, code, name, address, phone, region, active,
           hierarchy_node_id, store_type, timezone, ims_enabled, ims_enabled_on
    FROM store
    WHERE store_id = $1
  `,

  getStoreByName: `
    SELECT store_id, code, name, region, active, ims_enabled
    FROM public.store
    WHERE name = $1 AND active = true
    LIMIT 1
  `,

  getAlternateActiveStore: `
    SELECT store_id, code, name, region, active
    FROM store
    WHERE active = true AND name <> $1
    ORDER BY store_id
    LIMIT 1
  `,
};
