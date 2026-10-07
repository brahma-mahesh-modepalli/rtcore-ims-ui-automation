import { InventoryQueries } from './queries/InventoryQueries';
import { CreditRequestQueries } from './queries/CreditRequestQueries';
import { OrderingQueries } from './queries/OrderingQueries';
import { RecipeQueries } from './queries/RecipeQueries';
import { StoreQueries } from './queries/StoreQueries';
import { TransferQueries } from './queries/TransferQueries';
import { UomQueries } from './queries/UomQueries';
import { UserQueries } from './queries/UserQueries';
import { VendorItemQueries } from './queries/VendorItemQueries';
import { VendorQueries } from './queries/VendorQueries';
import { WastageQueries } from './queries/WastageQueries';

export { InventoryQueries } from './queries/InventoryQueries';
export { CreditRequestQueries } from './queries/CreditRequestQueries';
export { OrderingQueries } from './queries/OrderingQueries';
export { RecipeQueries } from './queries/RecipeQueries';
export { StoreQueries } from './queries/StoreQueries';
export { TransferQueries } from './queries/TransferQueries';
export { UomQueries } from './queries/UomQueries';
export { UserQueries } from './queries/UserQueries';
export { VendorItemQueries } from './queries/VendorItemQueries';
export { VendorQueries } from './queries/VendorQueries';
export { WastageQueries } from './queries/WastageQueries';

export const DBQueries = {
  ...StoreQueries,
  ...UserQueries,
  ...InventoryQueries,
  ...CreditRequestQueries,
  ...OrderingQueries,
  ...TransferQueries,
  ...RecipeQueries,
  ...WastageQueries,
  ...UomQueries,
  ...VendorItemQueries,
  ...VendorQueries,
};

