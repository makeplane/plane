import { useContext } from "react";
// types
import { IWorkspaceViewContext, WorkspaceIssueViewContext } from "contexts/workspace-view-context";

export const useWorkspaceView = (): IWorkspaceViewContext => {
  const context = useContext(WorkspaceIssueViewContext);

  if (!context) throw new Error("useWorkspaceView must be used within a WorkspaceIssueViewContext");

  return context;
};
