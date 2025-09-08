import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IConnectionStore } from "@/plane-web/store/integrations";

export const useConnections = (): IConnectionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSlackIntegration must be used within StoreProvider");

  return context.connections;
};
