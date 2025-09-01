import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IWorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
// mobx store

export enum EPageStoreType {
  WORKSPACE = "WORKSPACE_PAGE",
}

export type TReturnType = {
  [EPageStoreType.WORKSPACE]: IWorkspacePageStore;
};

export const usePageStore = <T extends EPageStoreType>(storeType: T): TReturnType[T] => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePageStore must be used within StoreProvider");

  if (storeType === EPageStoreType.WORKSPACE) {
    return context.workspacePages as TReturnType[T];
  }

  throw new Error(`Invalid store type: ${storeType}`);
};
