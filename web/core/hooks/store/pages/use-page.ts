import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// store
import { TProjectPage } from "@/store/pages/project-page";

export const usePage = (pageId: string | undefined): TProjectPage => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");

  if (!pageId) return {} as TProjectPage;

  return context.projectPages.data?.[pageId] ?? {};
};
