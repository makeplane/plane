import { observer } from "mobx-react";
import type { TIssue } from "@plane/types";
import { IssueDetailRoot } from "@/components/issues/issue-detail/root";

export type TWorkItemDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issue: TIssue | undefined;
};

export const WorkItemDetailRoot = observer(function WorkItemDetailRoot(props: TWorkItemDetailRoot) {
  const { workspaceSlug, projectId, issueId, issue } = props;

  return (
    <IssueDetailRoot
      workspaceSlug={workspaceSlug.toString()}
      projectId={projectId.toString()}
      issueId={issueId.toString()}
      is_archived={!!issue?.archived_at}
    />
  );
});
