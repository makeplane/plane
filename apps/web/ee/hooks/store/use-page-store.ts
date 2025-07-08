import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IWorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
import { ITeamspacePageStore } from "@/plane-web/store/teamspace/pages/teamspace-page.store";
// mobx store
import { IProjectPageStore } from "@/store/pages/project-page.store";

export enum EPageStoreType {
  PROJECT = "PROJECT_PAGE",
  TEAMSPACE = "TEAMSPACE_PAGE",
  WORKSPACE = "WORKSPACE_PAGE",
}

export type TReturnType = {
  [EPageStoreType.PROJECT]: IProjectPageStore;
  [EPageStoreType.TEAMSPACE]: ITeamspacePageStore;
  [EPageStoreType.WORKSPACE]: IWorkspacePageStore;
};

export const usePageStore = <T extends EPageStoreType>(storeType: T): TReturnType[T] => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePageStore must be used within StoreProvider");

  if (storeType === EPageStoreType.PROJECT) {
    return context.projectPages as TReturnType[T];
  }
  if (storeType === EPageStoreType.TEAMSPACE) {
    return context.teamspaceRoot.teamspacePage as TReturnType[T];
  }
  if (storeType === EPageStoreType.WORKSPACE) {
    return context.workspacePages as TReturnType[T];
  }

  throw new Error(`Invalid store type: ${storeType}`);
};
