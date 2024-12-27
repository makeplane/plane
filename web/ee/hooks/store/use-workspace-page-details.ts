import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web store
import { TWorkspacePage } from "@/plane-web/store/pages/workspace-page";

export const useWorkspacePageDetails = (pageId: string | undefined): TWorkspacePage => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspacePageDetails must be used within StoreProvider");

  if (!pageId) return {} as TWorkspacePage;

  return context.workspacePages.data?.[pageId] ?? {};
};
