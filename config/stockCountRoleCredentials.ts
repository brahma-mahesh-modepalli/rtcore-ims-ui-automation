export type StockCountRole =
  | 'marketLeader'
  | 'shiftLeader'
  | 'restaurantManager'
  | 'operatingPartner';

export type StockCountRoleAccount = {
  username: string;
  displayName: string;
};

const roleAccounts: Record<StockCountRole, StockCountRoleAccount> = {
  marketLeader: {
    username: 'rmarketleader@wbhq.com',
    displayName: 'Market Leader - RTC',
  },
  shiftLeader: {
    username: '0123456782@wbhq.com',
    displayName: 'RTC ShiftLeader',
  },
  restaurantManager: {
    username: '0123456783@wbhq.com',
    displayName: 'RTC RestaurantManager',
  },
  operatingPartner: {
    username: '0123456784@wbhq.com',
    displayName: 'RTC Operating Partner',
  },
};

export function getStockCountRoleAccount(role: StockCountRole): StockCountRoleAccount {
  return roleAccounts[role];
}

export function getStockCountRoleDisplayName(role: StockCountRole): string {
  return roleAccounts[role].displayName;
}