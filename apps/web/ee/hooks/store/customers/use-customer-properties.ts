import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web store
import { ICustomerPropertiesStore } from "@/plane-web/store/customers/customer-properties.store";

export const useCustomerProperties = (): ICustomerPropertiesStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCustomerProperties must be used within StoreProvider");
  return context.customerPropertiesStore;
};
