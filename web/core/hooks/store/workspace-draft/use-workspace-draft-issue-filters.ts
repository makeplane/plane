import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IWorkspaceDraftIssues } from "@/store/issue/workspace-draft";

export const useWorkspaceDraftIssueFilters = (): IWorkspaceDraftIssues => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceDraftIssueFilters must be used within StoreProvider");

  return context.issue.workspaceDraftIssues;
};
