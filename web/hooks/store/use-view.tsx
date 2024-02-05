import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { ViewRootStore } from "store/view/view-root.store";
// types
import { TViewTypes } from "@plane/types";

export const useView = (
  workspaceSlug: string,
  projectId: string | undefined,
  viewType: TViewTypes | undefined
): ViewRootStore | undefined => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useView must be used within StoreProvider");

  if (!workspaceSlug || !viewType) return undefined;

  switch (viewType) {
    case "WORKSPACE_YOUR_VIEWS":
      return context.view.workspaceViewMeStore;
    case "WORKSPACE_VIEWS":
      return context.view.workspaceViewStore;
    case "PROJECT_YOUR_VIEWS":
      if (!projectId) throw new Error("useView hook must require projectId");
      return context.view.projectViewMeStore;
    case "PROJECT_VIEWS":
      if (!projectId) throw new Error("useView hook must require projectId");
      return context.view.projectViewStore;
    default:
      return undefined;
  }
};
