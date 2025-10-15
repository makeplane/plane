import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";

export type TArgs = {
  pageId: string;
  storeType: EPageStoreType;
};

export const usePage = (args: TArgs) => {
  const { pageId, storeType } = args;
  // context
  const context = useContext(StoreContext);
  // store hooks
  const pageStore = usePageStore(storeType);

  if (context === undefined) throw new Error("usePage must be used within StoreProvider");
  if (!pageId) throw new Error("pageId is required");

  return pageStore.getPageById(pageId);
};
