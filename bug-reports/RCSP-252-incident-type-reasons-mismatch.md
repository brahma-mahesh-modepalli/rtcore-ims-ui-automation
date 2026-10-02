# Jira Bug Report / Root-Cause Update

## Summary
RCSP-252: Incident Type parity check used transaction reasons instead of the active incident type catalog

## Suggested Priority
Major / P2. The Credit Request form offers Incident Type values that are not represented in the database reason values used for comparison, creating inconsistent reason data and causing the RCSP-252 parity check to fail.

## Environment
- Application: QA Backoffice Dashboard
- Module: Ordering > Credit Requests > Damaged Items From Order
- Store used: WB Unit 1034
- Test: `TC_RCSP-252_01`

## Description
The initial RCSP-252 automation queried `public.credit_memo_line.reason`. That column stores transaction reason text together with answer details; it is not the master list of valid Incident Type choices. Comparing it with the UI dropdown produced a false mismatch.

The correct source of truth is the active Incident Type catalog in `public.incident_type.description`.

## Steps to Reproduce
1. Connect to the QA database and run the original transaction-reason query:

   ```sql
   SELECT DISTINCT reason
   FROM public.credit_memo_line
   WHERE reason IS NOT NULL AND btrim(reason) <> ''
   ORDER BY reason;
   ```

2. Observe that each reason may contain additional damaged-item answer details.
3. Query the correct active master values:

   ```sql
   SELECT description
   FROM public.incident_type
   WHERE active = true;
   ```

4. Sign in to the QA Backoffice Dashboard and switch to WB Unit 1034.
5. Navigate to Ordering > Credit Requests.
6. Click **New Credit Request**.
7. Select an eligible completed PO with received items and click **Start Credit Request**.
8. Select the first **Damaged** item.
9. Open the **Incident type** dropdown and compare its complete option list to active `incident_type.description` values.

## Actual Result
The old query returns transaction reason records, including answer text, and does not represent the complete UI master list. The initial comparison therefore reported a mismatch.

## Expected Result
The Incident Type dropdown should match the active `public.incident_type.description` values exactly, with no missing or extra choices.

## Evidence
- Playwright test: `tests/EPIC-RCSP-120/RCSP-252.spec.ts`
- Database query: `database/queries/CreditRequestQueries.ts`
