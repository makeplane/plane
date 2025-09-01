import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ISelfHostedSubscriptionStore } from "@/plane-web/store/subscription/self-hosted-subscription.store";

export const useSelfHostedSubscription = (): ISelfHostedSubscriptionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSelfHostedSubscription must be used within StoreProvider");
  return context.selfHostedSubscription;
};
