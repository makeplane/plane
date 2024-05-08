import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IPageStore } from "@/store/pages/page.store";

export const usePage = (pageId: string | undefined): IPageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");

  if (!pageId) return {} as IPageStore;

  return context.projectPages.data?.[pageId] ?? {};
};
