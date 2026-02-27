import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { DashboardStore } from "@/plane-web/store/dashboards/dashboard.store";

export const useCustomDashboard = (): DashboardStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCustomDashboard must be used within StoreProvider");
  return (context as any).customDashboard;
};
