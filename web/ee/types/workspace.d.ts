// types
import { TProductSubscriptionType } from "@plane/types";

export type TWorkspaceWithProductDetails = {
  workspace_id: string;
  slug: string;
  name: string;
  logo: string;
  product: TProductSubscriptionType;
  is_on_trial: boolean;
  is_billing_active: boolean;
};
