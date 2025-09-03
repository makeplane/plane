import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IRecurringWorkItemActivityStore } from "@/plane-web/store/recurring-work-items/activity.store";

export const useRecurringWorkItemActivity = (): IRecurringWorkItemActivityStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useRecurringWorkItemActivity must be used within StoreProvider");
  return context.recurringWorkItemsRoot.recurringWorkItemActivities;
};
