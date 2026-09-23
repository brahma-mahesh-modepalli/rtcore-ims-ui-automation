/**
 * External System Credentials
 * ============================
 * Credentials for systems outside the QA Backoffice application
 * (e.g. ActiveBatch) used by multi-system E2E flows such as RCSP-246.
 *
 * Secrets are read from environment variables only. Populate them in a
 * local, gitignored `.env` file — never hardcode secrets in source.
 */

export class ExternalSystemCredentials {
  static get activeBatch() {
    return {
      url: process.env.ACTIVEBATCH_URL || 'https://activebatch.wbhq.com/',
      username: process.env.ACTIVEBATCH_USERNAME || '',
      password: process.env.ACTIVEBATCH_PASSWORD || '',
    } as const;
  }

  static get flowersTester() {
    return {
      url: process.env.FLOWERS_TESTER_URL || 'https://ims-tests.wbazqaessase.p.azurewebsites.net/flowers-tester',
    } as const;
  }
}
