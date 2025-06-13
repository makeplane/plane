import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IProjectPageStore } from "@/store/pages/project-page.store";

export const EPageStoreType = {
  PROJECT: "PROJECT_PAGE",
} as const;

export type EPageStoreType = typeof EPageStoreType[keyof typeof EPageStoreType];

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
