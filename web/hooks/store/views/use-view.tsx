import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { ViewRootStore } from "store/view/view-root.store";
import { TViewTypes } from "@plane/types";
// constants
import { VIEW_TYPES } from "constants/view";

export const useView = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  viewType: TViewTypes | undefined
): ViewRootStore | undefined => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useView must be used within StoreProvider");

  if (!workspaceSlug || !viewType) return undefined;

  switch (viewType) {
    case VIEW_TYPES.WORKSPACE_PRIVATE_VIEWS:
      return context.view.workspacePrivateViewStore;
    case VIEW_TYPES.WORKSPACE_PUBLIC_VIEWS:
      return context.view.workspacePublicViewStore;
    case VIEW_TYPES.PROJECT_PRIVATE_VIEWS:
      if (!projectId) return undefined;
      return context.view.projectPrivateViewStore;
    case VIEW_TYPES.PROJECT_PUBLIC_VIEWS:
      if (!projectId) return undefined;
      return context.view.projectPublicViewStore;
    default:
      return undefined;
  }
};
