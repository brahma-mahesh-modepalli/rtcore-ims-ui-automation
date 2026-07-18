/**
 * Staging Environment Configuration
 */

export const stagingConfig = {
  name: 'Staging',
  baseURL: 'https://staging-backoffice.wbhq.com',
  loginURL: 'https://staging-backoffice.wbhq.com/login',
  dashboardURL: 'https://staging-backoffice.wbhq.com/dashboard',
  credentials: {
    admin: {
      username: 'admin@whataburger-ims.com',
      password: 'admin123',
      role: 'admin',
    },
    manager: {
      username: 'manager@whataburger-ims.com',
      password: 'manager123',
      role: 'manager',
    },
    user: {
      username: 'user@whataburger-ims.com',
      password: 'user123',
      role: 'user',
    },
  },
  timeout: 30000,
  navigationTimeout: 10000,
} as const;
