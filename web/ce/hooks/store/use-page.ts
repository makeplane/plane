import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// store
import { TProjectPage } from "@/store/pages/project-page";

export type TArgs = {
  pageId: string | undefined;
  storeType: EPageStoreType;
};

export const usePage = (args: TArgs) => {
  const { pageId, storeType } = args;
  // context
  const context = useContext(StoreContext);
  // store hooks
  const pageStore = usePageStore(storeType);

  if (context === undefined) throw new Error("usePage must be used within StoreProvider");
  if (!pageId) return {} as TProjectPage;

  return pageStore.data?.[pageId] ?? {};
};
