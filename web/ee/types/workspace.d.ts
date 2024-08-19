// types
import { TProductSubscriptionType } from "@plane/types";

export type TWorkspaceWithProductDetails = {
  workspace_id: string;
  slug: string;
  name: string;
  logo: string;
  product: TProductSubscriptionType;
  current_period_end_date: string;
  has_activated_free_trial: boolean;
  has_added_payment_method: boolean;
  trial_end_date: string;
  is_offline_payment: boolean;
  subscription: string;
};
