/**
 * QA Environment Configuration
 */

export const qaConfig = {
  name: 'QA',
  baseURL: 'https://qa-backoffice.wbhq.com',
  loginURL: 'https://qa-backoffice.wbhq.com/login',
  dashboardURL: 'https://qa-backoffice.wbhq.com/dashboard',
  credentials: {
    admin: {
      username: 'admin@ims.com',
      password: 'Ims-go-live@0815',
      role: 'admin',
    },
    manager: {
      username: 'admin@ims.com',
      password: 'Ims-go-live@0815',
      role: 'manager',
    },
    user: {
      username: 'admin@ims.com',
      password: 'Ims-go-live@0815',
      role: 'user',
    },
  },
  timeout: 30000,
  navigationTimeout: 10000,
} as const;
