import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
import { TUsePage } from "@/store/pages/base-page";
// store
import { TProjectPage } from "@/store/pages/project-page";

export const useProjectPage: TUsePage = (pageId: string | undefined): TProjectPage => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");

  if (!pageId) return {} as TProjectPage;

  return context.projectPages.data?.[pageId] ?? {};
};
