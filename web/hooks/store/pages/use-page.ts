import { useContext } from "react";
// context
import { StoreContext } from "contexts/store-context";
// mobx store
import { IPageStore } from "store/pages/page.store";

export const usePage = (projectId: string | undefined, pageId: string | undefined): IPageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectPublish must be used within StoreProvider");

  if (!projectId || !pageId) return {} as IPageStore;

  return context.projectPage.data?.[projectId]?.[pageId] ?? {};
};
