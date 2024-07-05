import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IPage } from "@/store/pages/page";

export const usePage = (pageId: string | undefined): IPage => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");

  if (!pageId) return {} as IPage;

  return context.projectPages.data?.[pageId] ?? {};
};
