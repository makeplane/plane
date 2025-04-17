import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web store
import { ICustomersStore } from "@/plane-web/store/customers/customers.store";

export const useCustomers = (): ICustomersStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCustomers must be used within StoreProvider");
  return context.customersStore;
};
