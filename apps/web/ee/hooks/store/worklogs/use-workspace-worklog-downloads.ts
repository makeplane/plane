import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web store
import { IWorkspaceWorklogDownloadStore } from "@/plane-web/store/workspace-worklog";

export const useWorkspaceWorklogDownloads = (): IWorkspaceWorklogDownloadStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceWorklogDownloads must be used within StoreProvider");

  return context.workspaceWorklogDownloads ?? {};
};
