import { execFileSync } from 'node:child_process';

export type XenialSaleInput = {
  orderNumber: number;
  externalId: string;
  currentDate?: string;
};

export type XenialSalePayload = {
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

export function buildXenialSalePayload({
  orderNumber,
  externalId,
  currentDate,
}: XenialSaleInput): XenialSalePayload {
  const currentIso = currentDate ?? new Date().toISOString();
  return {
    entityName: 'Order',
    data: {
      _id: externalId,
      business_date: currentIso.split('T')[0],
      order_number: String(orderNumber),
      time: {
        closed: currentIso,
      },
    },
  };
}

export function buildXenialSaleCurlCommand(input: XenialSaleInput): string {
  const payload = buildXenialSalePayload(input);
  const body = JSON.stringify(payload, null, 2);
  return `curl --location 'https://qa-backoffice.wbhq.com/api/v1/sales/xenial' \\\n  --header 'Content-Type: application/json' \\\n  --data '${body.replace(/'/g, "'\\''")}'`;
}

export function runXenialSaleCurl(input: XenialSaleInput): string {
  const payload = buildXenialSalePayload(input);
  const rawBody = JSON.stringify(payload);

  const stdout = execFileSync(
    'curl',
    [
      '--location',
      'https://qa-backoffice.wbhq.com/api/v1/sales/xenial',
      '--header',
      'Content-Type: application/json',
      '--data',
      rawBody,
      '--silent',
      '--show-error',
    ],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  return stdout;
}
