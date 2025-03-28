import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IBaseDashboardsStore } from "@/plane-web/store/dashboards/base-dashboards.store";

export const useDashboards = (): IBaseDashboardsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useDashboards must be used within StoreProvider");
  return context.baseDashboards;
};
