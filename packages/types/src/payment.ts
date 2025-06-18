export enum EProductSubscriptionEnum {
  FREE = "FREE",
  ONE = "ONE",
  PRO = "PRO",
  BUSINESS = "BUSINESS",
  ENTERPRISE = "ENTERPRISE",
}

export type TBillingFrequency = "month" | "year";

export type IPaymentProductPrice = {
  currency: string;
  id: string;
  product: string;
  recurring: TBillingFrequency;
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

export type TSubscriptionPrice = {
  key: string;
  id: string | undefined;
  currency: string;
  price: number;
  recurring: TBillingFrequency;
};

export type TProductBillingFrequency = {
  [key in EProductSubscriptionEnum]: TBillingFrequency | undefined;
};
