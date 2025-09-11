import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ISentryStore } from "@/plane-web/store/integrations";

export const useSentryIntegration = (): ISentryStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSentryIntegration must be used within StoreProvider");

  return context.sentryIntegration;
};
