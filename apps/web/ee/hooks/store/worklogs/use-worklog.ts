import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web store
import { IWorklog } from "@/plane-web/store/workspace-worklog";

export const useWorklog = (worklogId: string): IWorklog => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorklog must be used within StoreProvider");

  if (!worklogId) return {} as IWorklog;
  return context.workspaceWorklogs.worklogs[worklogId] ?? {};
};
