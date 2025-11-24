import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IWorkspaceDraftIssues } from "@/store/issue/workspace-draft";

export const useWorkspaceDraftIssues = (): IWorkspaceDraftIssues => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceDraftIssues must be used within StoreProvider");

  return context.issue.workspaceDraftIssues;
};
