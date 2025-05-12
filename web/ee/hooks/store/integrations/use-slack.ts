import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ISlackStore } from "@/plane-web/store/integrations";

export const useSlackIntegration = (): ISlackStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSlackIntegration must be used within StoreProvider");

  return context.slackIntegration;
};
