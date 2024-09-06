export type IPaymentProductPrice = {
  currency: string;
  id: string;
  product: string;
  recurring: "month" | "year";
  unit_amount: number;
  workspace_amount: number;
};

export type TProductSubscriptionType = "FREE" | "ONE" | "PRO" | "ULTIMATE";

export type IPaymentProduct = {
  description: string;
  id: string;
  name: string;
  type: Omit<TProductSubscriptionType, "FREE">;
  payment_quantity: number;
  prices: IPaymentProductPrice[];
};

export type IWorkspaceProductSubscription = {
  product: TProductSubscriptionType;
  is_cancelled?: boolean;
  is_self_managed: boolean;
  interval?: "month" | "year" | null;
  current_period_end_date: string | null;
  is_offline_payment: boolean;
  trial_end_date: string | undefined;
  purchased_seats: number | undefined;
  has_activated_free_trial: boolean;
  has_added_payment_method: boolean;
  subscription: string | undefined;
  is_on_trial: boolean;
  is_trial_allowed: boolean;
  remaining_trial_days: number | null;
  has_upgraded: boolean;
  show_payment_button: boolean;
  show_trial_banner: boolean;
  free_seats: number | null;
};
