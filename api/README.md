# API Automation Folder Structure

This project keeps API integrations separate from UI tests so the same DB-driven values can be reused in both flows.

## Folder structure

```text
api/
  sales/
    XenialSaleApi.ts
```

## Expected usage

```ts
import { buildXenialSaleCurlCommand } from '../api/sales/XenialSaleApi';

const saleData = await testData.getUniqueSaleData(37);
const orderNumber = saleData!.new_order_number;
const externalId = saleData!.new_external_id;
const currentDate = new Date().toISOString();

const curlCommand = buildXenialSaleCurlCommand({
  orderNumber,
  externalId,
  currentDate,
});
```

The API payload uses DB-driven values and can be swapped dynamically without editing the curl text each time.
