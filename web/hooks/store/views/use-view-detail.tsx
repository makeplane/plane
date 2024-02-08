import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// store
import { TViewStore } from "store/view/view.store";
// types
import { TViewTypes } from "@plane/types";
// constants
import { VIEW_TYPES } from "constants/view";

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
    case VIEW_TYPES.WORKSPACE_PRIVATE_VIEWS:
      return context.view.workspacePrivateViewStore.viewById(viewId);
    case VIEW_TYPES.WORKSPACE_PUBLIC_VIEWS:
      return context.view.workspacePublicViewStore.viewById(viewId);
    case VIEW_TYPES.PROJECT_PRIVATE_VIEWS:
      if (!projectId) return undefined;
      return context.view.projectPrivateViewStore.viewById(viewId);
    case VIEW_TYPES.PROJECT_PUBLIC_VIEWS:
      if (!projectId) return undefined;
      return context.view.projectPublicViewStore.viewById(viewId);
    default:
      return undefined;
  }
};
