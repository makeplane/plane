import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IWorkspaceSubscriptionStore } from "@/plane-web/store/subscription/subscription.store";

export const useWorkspaceSubscription = (): IWorkspaceSubscriptionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceSubscription must be used within StoreProvider");
  return context.workspaceSubscription;
};
