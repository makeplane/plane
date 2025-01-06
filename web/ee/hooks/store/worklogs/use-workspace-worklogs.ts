import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web store
import { IWorkspaceWorklogStore } from "@/plane-web/store/workspace-worklog/workspace-worklog.store";

export const useWorkspaceWorklogs = (): IWorkspaceWorklogStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceWorklogs must be used within StoreProvider");

  return context.workspaceWorklogs ?? {};
};
