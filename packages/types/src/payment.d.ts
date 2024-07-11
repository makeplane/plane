export type IPaymentProductPrice = {
  currency: string;
  id: string;
  product: string;
  recurring: "month" | "year";
  unit_amount: number;
  workspace_amount: number;
};

export type TProductSubscriptionType = "FREE" | "PRO" | "ULTIMATE";

export type IPaymentProduct = {
  description: string;
  id: string;
  name: string;
  type: Omit<TProductSubscriptionType, "FREE">;
  prices: IPaymentProductPrice[];
};

export type IWorkspaceProductSubscription = {
  product: TProductSubscriptionType;
  current_period_end_date: string | null;
};
