import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// store
import { TViewStore } from "store/view/view.store";
// types
import { TViewTypes } from "@plane/types";

export const useViewDetail = (
  workspaceSlug: string,
  projectId: string | undefined,
  viewId: string,
  viewType: TViewTypes | undefined
): TViewStore | undefined => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useViewDetail must be used within StoreProvider");

  if (!workspaceSlug || !viewId) return undefined;

  switch (viewType) {
    case "WORKSPACE_YOUR_VIEWS":
      return context.view.workspaceViewMeStore.viewById(viewId);
    case "WORKSPACE_VIEWS":
      return context.view.workspaceViewStore.viewById(viewId);
    case "PROJECT_YOUR_VIEWS":
      if (!projectId) throw new Error("useView hook must require projectId");
      return context.view.projectViewMeStore.viewById(viewId);
    case "PROJECT_VIEWS":
      if (!projectId) throw new Error("useView hook must require projectId");
      return context.view.projectViewStore.viewById(viewId);
    default:
      return undefined;
  }
};
