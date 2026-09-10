import { InventoryQueries } from './queries/InventoryQueries';
import { RecipeQueries } from './queries/RecipeQueries';
import { StoreQueries } from './queries/StoreQueries';
import { TransferQueries } from './queries/TransferQueries';
import { UomQueries } from './queries/UomQueries';
import { UserQueries } from './queries/UserQueries';
import { WastageQueries } from './queries/WastageQueries';

export { InventoryQueries } from './queries/InventoryQueries';
export { OrderingQueries } from './queries/OrderingQueries';
export { RecipeQueries } from './queries/RecipeQueries';
export { StoreQueries } from './queries/StoreQueries';
export { TransferQueries } from './queries/TransferQueries';
export { UomQueries } from './queries/UomQueries';
export { UserQueries } from './queries/UserQueries';
export { WastageQueries } from './queries/WastageQueries';

export const DBQueries = {
  ...StoreQueries,
  ...UserQueries,
  ...InventoryQueries,
  ...TransferQueries,
  ...RecipeQueries,
  ...WastageQueries,
  ...UomQueries,
};

