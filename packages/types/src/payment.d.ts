export type IPaymentProductPrice = {
  currency: string;
  id: string;
  product: string;
  recurring: "month" | "year";
  unit_amount: number;
  workspace_amount: number;
};

export type IPaymentProduct = {
  description: string;
  id: string;
  name: string;
  type: "PRO" | "ULTIMATE";
  prices: IPaymentProductPrice[];
};
