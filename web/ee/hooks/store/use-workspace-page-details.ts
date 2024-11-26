import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web store
import { IWorkspacePageDetails } from "@/plane-web/store/pages/page";

export const useWorkspacePageDetails = (pageId: string | undefined): IWorkspacePageDetails => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspacePageDetails must be used within StoreProvider");

  if (!pageId) return {} as IWorkspacePageDetails;

  return context.workspacePages.data?.[pageId] ?? {};
};
