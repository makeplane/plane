import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IWorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";

export const useWorkspacePages = (): IWorkspacePageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspacePages must be used within StoreProvider");
  return context.workspacePages;
};
