import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IWorkspaceFeatureStore } from "@/plane-web/store/workspace-feature.store";

export const useWorkspaceFeatures = (): IWorkspaceFeatureStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceFeatures must be used within StoreProvider");
  return context.workspaceFeatures;
};
