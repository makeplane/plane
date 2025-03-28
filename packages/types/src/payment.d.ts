export type IPaymentProductPrice = {
  currency: string;
  id: string;
  product: string;
  recurring: "month" | "year";
  unit_amount: number;
  workspace_amount: number;
};

export type TProductSubscriptionType = "FREE" | "ONE" | "PRO" | "BUSINESS" | "ENTERPRISE";

export type IPaymentProduct = {
  description: string;
  id: string;
  name: string;
  type: Omit<TProductSubscriptionType, "FREE">;
  payment_quantity: number;
  prices: IPaymentProductPrice[];
  is_active: boolean;
};

export type IWorkspaceProductSubscription = {
  product: TProductSubscriptionType;
  is_cancelled?: boolean;
  is_self_managed: boolean;
  interval?: "month" | "year" | null;
  current_period_start_date: string | null;
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
  is_trial_ended: boolean;
  has_upgraded: boolean;
  show_payment_button: boolean;
  show_trial_banner: boolean;
  free_seats: number | null;
  billable_members: number | null;
  occupied_seats: number | null;
  show_seats_banner: boolean;
  is_free_member_count_exceeded: boolean;
  can_delete_workspace: boolean;
};

export type TMemberInviteCheck = {
  invite_allowed: boolean;
  allowed_admin_members: number;
  allowed_guests: number;
};

export type TUpdateSeatVariant = "ADD_SEATS" | "REMOVE_SEATS";

export type TAddWorkspaceSeatsModal = {
  isOpen: boolean;
};

export type TProrationPreview = {
  quantity_difference: number;
  per_seat_prorated_amount: number;
  current_quantity: number;
  new_quantity: number;
  total_prorated_amount: number;
  current_price_amount: number;
  current_price_interval: "MONTHLY" | "YEARLY";
};
