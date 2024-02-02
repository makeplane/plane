import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { ViewRoot } from "store/view/view-root.store";
// types
import { TViewTypes } from "@plane/types";

export const useView = (
  workspaceSlug: string,
  projectId: string | undefined,
  viewType: TViewTypes | undefined
): ViewRoot => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useView must be used within StoreProvider");

  if (!workspaceSlug) throw new Error("useView hook must require workspaceSlug");

  switch (viewType) {
    case "WORKSPACE_YOUR_VIEWS":
      return context.view.workspaceViewStore;
    case "WORKSPACE_VIEWS":
      return context.view.workspaceViewMeStore;
    case "WORKSPACE_PROJECT_VIEWS":
      return context.view.workspaceViewMeStore;
    case "PROJECT_YOUR_VIEWS":
      if (!projectId) throw new Error("useView hook must require projectId");
      return context.view.projectViewMeStore;
    case "PROJECT_VIEWS":
      if (!projectId) throw new Error("useView hook must require projectId");
      return context.view.projectViewStore;
    default:
      throw new Error("useView hook must require viewType");
  }
};
