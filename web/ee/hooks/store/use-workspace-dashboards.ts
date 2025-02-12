import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IWorkspaceDashboardsStore } from "@/plane-web/store/dashboards/workspace-dashboards.store";

export const useWorkspaceDashboards = (): IWorkspaceDashboardsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceDashboards must be used within StoreProvider");
  return context.workspaceDashboards;
};
