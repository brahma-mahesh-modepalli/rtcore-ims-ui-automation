export type XenialProductKey = 'jalapenoBurger' | 'fries' | 'powerade';

export type XenialProduct = {
  key: XenialProductKey;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  tax: number;
};

export const XENIAL_PRODUCTS: Record<XenialProductKey, XenialProduct> = {
  jalapenoBurger: {
    key: 'jalapenoBurger',
    product_id: '131011',
    name: '#4 JALAPENO & CHZ WB ML',
    price: 10.49,
    quantity: 1,
    tax: 0.87,
  },
  fries: {
    key: 'fries',
    product_id: '130339',
    name: 'MD FRIES',
    price: 0,
    quantity: 1,
    tax: 0,
  },
  powerade: {
    key: 'powerade',
    product_id: '130122',
    name: 'MD POWERADE',
    price: 0,
    quantity: 1,
    tax: 0,
  },
};

export const XENIAL_PRODUCT_COMBINATIONS: XenialProductKey[][] = [
  ['jalapenoBurger'],
  ['fries'],
  ['powerade'],
  ['jalapenoBurger', 'fries'],
  ['jalapenoBurger', 'powerade'],
  ['fries', 'powerade'],
  ['jalapenoBurger', 'fries', 'powerade'],
];

export function buildXenialProductItems(
  products: XenialProduct[],
  currentIso: string,
): Record<string, unknown>[] {
  return products.map((product) => ({
    discount_info: { discounts: [], total: 0, total_unrounded: 0 },
    fractional_quantity: { numerator: 0, denominator: 0 },
    item_count_quantity: product.quantity,
    item_type: 'standard',
    tags: '',
    name: product.name,
    order_item_id: crypto.randomUUID(),
    payment_status: 'paid',
    price: product.price,
    price_adjustment: 0,
    product_id: product.product_id,
    quantity: product.quantity,
    state: 'pending',
    tax_inclusive: false,
    tax_inclusive_price: product.price,
    tax_info: {
      taxes: [],
      total: product.tax,
      total_unrounded: 0,
      total_exclusive: 0,
      total_exclusive_unrounded: 0,
      total_marketplace_liable: 0,
      total_marketplace_liable_unrounded: 0,
      total_inclusive: 0,
      total_inclusive_unrounded: 0,
    },
    time: {
      added: currentIso,
      first_item_added: currentIso,
      created: currentIso,
      kitchen_sent: currentIso,
      last_modified: currentIso,
    },
    timestamp: currentIso,
    unit_price: product.price,
    itempriority: 80,
    child_items: [],
  }));
}
