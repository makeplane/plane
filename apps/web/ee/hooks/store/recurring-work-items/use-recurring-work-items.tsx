import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IRecurringWorkItemStore } from "@/plane-web/store/recurring-work-items/base.store";

export const useRecurringWorkItems = (): IRecurringWorkItemStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useRecurringWorkItems must be used within StoreProvider");
  return context.recurringWorkItemsRoot.recurringWorkItems;
};
