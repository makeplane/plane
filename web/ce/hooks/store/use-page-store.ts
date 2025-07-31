import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IProjectPageStore } from "@/store/pages/project-page.store";
import { IPageFolderStore } from "@/store/pages/page-folder.store";

export enum EPageStoreType {
  PROJECT = "PROJECT_PAGE",
}

export type TReturnType = {
  [EPageStoreType.PROJECT]: IProjectPageStore;
};

export const usePageStore = <T extends EPageStoreType>(storeType: T): TReturnType[T] => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePageStore must be used within StoreProvider");

  if (storeType === EPageStoreType.PROJECT) {
    return context.projectPages;
  }

  throw new Error(`Invalid store type: ${storeType}`);
};

export const usePageFolderStore = (): IPageFolderStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePageFolderStore must be used within StoreProvider");

  return context.pageFolders;
};
