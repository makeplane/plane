import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IDashboardStore } from "@/plane-web/store/dashboards/dashboard.store";
import type { RootStore as _RootStore } from "@/plane-web/store/root.store";

export const useCustomDashboard = (): IDashboardStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCustomDashboard must be used within StoreProvider");
  return context.customDashboard;
};
