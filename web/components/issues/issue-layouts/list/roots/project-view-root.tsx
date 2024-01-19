import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// store
import { useIssues } from "hooks/store";
// constants
import { EIssuesStoreType } from "constants/issue";
// types
import { EIssueActions } from "../../types";
import { TIssue } from "@plane/types";
// components
import { BaseListRoot } from "../base-list-root";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";

export interface IViewListLayout {
  issueActions: {
    [EIssueActions.DELETE]: (issue: TIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: TIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: TIssue) => Promise<void>;
  };
}

export const ProjectViewListLayout: React.FC<IViewListLayout> = observer((props) => {
  const { issueActions } = props;
  // store
  const { issuesFilter, issues } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  if (!workspaceSlug || !projectId) return null;

  return (
    <BaseListRoot
      issuesFilter={issuesFilter}
      issues={issues}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      storeType={EIssuesStoreType.PROJECT_VIEW}
      viewId={viewId?.toString()}
    />
  );
});
