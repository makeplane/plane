import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web store
import { IWorklogDownload } from "@/plane-web/store/workspace-worklog";

export const useWorklogDownload = (worklogDownloadId: string): IWorklogDownload => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorklogDownload must be used within StoreProvider");

  if (!worklogDownloadId) return {} as IWorklogDownload;
  return context.workspaceWorklogDownloads.worklogDownloads[worklogDownloadId] ?? {};
};
