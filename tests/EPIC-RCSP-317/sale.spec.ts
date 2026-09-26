import { test, expect } from '../../fixtures/baseTest';
import { SalesPage } from '../../pages/Sales/SalesPage';
import { TestDataRepository } from '../../test-data/TestDataRepository';
import {
  buildXenialProductItems,
  XENIAL_PRODUCTS,
  XENIAL_PRODUCT_COMBINATIONS,
  type XenialProduct,
  type XenialProductKey,
} from '../../api/sales/XenialSaleProducts';

type SaleApiPayload = {
  entityName: string;
  data: {
    _id: string;
    business_date: string;
    order_number: string;
    time: {
      closed: string;
    };
    [key: string]: unknown;
  };
};

function buildSalePayload(
  saleData: { new_order_number: number; new_external_id: string },
  products: XenialProduct[],
  storeNumber: string,
  currentDate?: string,
): SaleApiPayload {
  const currentIso = currentDate ?? new Date().toISOString();
  const businessDate = currentIso.split('T')[0];
  const subtotal = products.reduce((total, product) => total + product.price * product.quantity, 0);
  const taxTotal = products.reduce((total, product) => total + product.tax * product.quantity, 0);
  const orderTotal = subtotal + taxTotal;
  const paymentId = crypto.randomUUID();

  return {
    entityName: 'Order',
    data: {
      _id: saleData.new_external_id,
      additional_properties: {
        iris: {
          application: 'XenialSync',
          iris_version: '5.0.650.300 RC',
          order_type: 'pos',
          order_state: 1,
          order_substate: 0,
          order_destination: 32,
        },
      },
      business_date: businessDate,
      comment: '',
      company_id: '5aafe11e854bdf2600767304',
      creator: {
        employee: { id: '5', title: 'employee', name: ' ' },
        terminal: { id: '5', terminal_number: '5', title: 'xsREG5' },
        time: currentIso,
      },
      customer: {
        first_name: '',
        last_name: '',
        table_tent: '',
        loyalty_info: {
          balances: [{ balance: 0 }],
          customer: { identification_method: 'code' },
        },
      },
      destination: {
        external_id: '32',
        id: '32',
        name: '2 Drive Thru',
        short_name: 'DT2',
        consumption_type: 'OnPremises',
      },
      discount_info: { discounts: [], total: 0, total_unrounded: 0 },
      fulfillment_status: 'pending',
      guest_count: 1,
      items: buildXenialProductItems(products, currentIso),
      notification_status: 'paid',
      order_number: String(saleData.new_order_number),
      order_point: 'xsREG5',
      order_source: '',
      order_source_ext: { name: '', order_source_id: '' },
      order_status: { status: 'closed' },
      order_type: 'order',
      origin: storeNumber,
      owner: { id: '5', title: 'employee', name: ' ' },
      payment_info: {
        change: 0,
        tips: 0,
        total: orderTotal,
        payments: [
          {
            amount: orderTotal,
            code: 'credit',
            host_reference_id: '',
            id: paymentId,
            pay_type_id: '201',
            pay_type_name: 'Visa',
            payment_id: '201',
            status: 'PAID',
            tip_amount: 0,
            transaction_type: 'SALE',
          },
        ],
      },
      payment_status: 'paid',
      site_info: {
        address: '17311 Bulverde Rd',
        city: 'San Antonio',
        company: { id: '5aafe11e854bdf2600767304' },
        id: '5af357c34b3258001aa6d87e',
        name: 'Whataburger',
        phone: '(210)404-9936',
        state: 'TX',
        store_number: storeNumber,
        timezone: 'US/Central',
      },
      state: 'closed',
      store_number: storeNumber,
      subtotal,
      tax_inclusive_subtotal: subtotal,
      tax_info: {
        taxes: [
          {
            name: 'Main',
            amount: taxTotal,
            amount_unrounded: taxTotal,
            external_id: '1',
            marketplace_liable: false,
          },
        ],
        total: taxTotal,
        total_unrounded: taxTotal,
        total_exclusive: taxTotal,
        total_exclusive_unrounded: taxTotal,
        total_marketplace_liable: 0,
        total_marketplace_liable_unrounded: 0,
        total_inclusive: 0,
        total_inclusive_unrounded: 0,
      },
      time: {
        first_item_added: currentIso,
        closed: currentIso,
        created: currentIso,
        kitchen_bump: currentIso,
        kitchen_sent: currentIso,
        last_modified: currentIso,
        notification_committed: currentIso,
        notification_open: currentIso,
        open: currentIso,
      },
      total: orderTotal,
      version: 'IRIS',
    },
  } as SaleApiPayload;
}

function buildCurlCommand(payload: SaleApiPayload): string {
  const requestBody = JSON.stringify(payload, null, 2);
  return `curl --location 'https://qa-backoffice.wbhq.com/api/v1/sales/xenial' \\\n+  --header 'Content-Type: application/json' \\\n+  --data '${requestBody.replace(/'/g, "'\\''")}'`;
}

test.describe('RCSP-317 - Xenial sale sync and IMS sales search', () => {
  test.setTimeout(120_000);

  for (const productKeys of XENIAL_PRODUCT_COMBINATIONS) {
    const selectedProducts = productKeys.map((productKey: XenialProductKey) => XENIAL_PRODUCTS[productKey]);
    const scenarioName = productKeys.join(' + ');

    test(`creates a sale with ${scenarioName} and verifies it in Sales UI`, async ({ page, request, activeStoreContext }) => {
    const repository = new TestDataRepository();
    const saleData = await repository.getUniqueSaleData(37);

    expect(saleData, 'Expected DB to return a unique saleData row').toBeTruthy();
    const orderNumber = Number(saleData!.new_order_number);
    expect(orderNumber).toBeGreaterThan(0);
    expect(saleData!.new_external_id).toBeTruthy();

    const externalId = saleData!.new_external_id;
    const currentDate = new Date().toISOString();

    const payload = buildSalePayload({
      new_order_number: orderNumber,
      new_external_id: externalId,
    }, selectedProducts, activeStoreContext.storeNumber, currentDate);

    const response = await request.post('https://qa-backoffice.wbhq.com/api/v1/sales/xenial', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: payload,
    });

    const responseText = await response.text();
    expect(response.ok, `Failed to create sale via API: ${responseText}`).toBeTruthy();

    const salesPage = new SalesPage(page);
    await salesPage.openSalesTransactions();

    const searchField = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole('textbox', { name: /search/i }))
      .or(page.locator('input[placeholder*="search" i]'))
      .first();

    await expect(searchField).toBeVisible({ timeout: 20000 });
    await searchField.fill(String(orderNumber));
    await page.waitForTimeout(1500);

    await expect.poll(async () => {
      const count = await page.getByText(String(orderNumber), { exact: true }).count();
      return count > 0;
    }, { timeout: 30000 }).toBeTruthy();

    await expect(page.getByText(String(orderNumber), { exact: true }).first()).toBeVisible({ timeout: 20000 });

    console.log('Generated orderNumber:', orderNumber);
    console.log('Generated externalId:', externalId);
    console.log('Products:', scenarioName);
    console.log('CurrentDate:', currentDate);
    console.log('Curl command:', buildCurlCommand(payload));
    });
  }
});
