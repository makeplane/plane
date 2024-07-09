// types
import { TProductSubscriptionType } from "@plane/types";

export type TWorkspaceWithProductDetails = {
  workspace_id: string;
  slug: string;
  name: string;
  logo: string;
  product: TProductSubscriptionType;
  current_period_end_date: string;
};