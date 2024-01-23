import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { useIssues } from "hooks/store";
// components
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
// types
import { EIssueActions } from "../../types";
import { TIssue } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";

export interface IViewSpreadsheetLayout {
  issueActions: {
    [EIssueActions.DELETE]: (issue: TIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: TIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: TIssue) => Promise<void>;
  };
}

export const ProjectViewSpreadsheetLayout: React.FC<IViewSpreadsheetLayout> = observer((props) => {
  const { issueActions } = props;
  // router
  const router = useRouter();
  const { viewId } = router.query;

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);

  return (
    <BaseSpreadsheetRoot
      issueStore={issues}
      issueFiltersStore={issuesFilter}
      issueActions={issueActions}
      QuickActions={ProjectIssueQuickActions}
      viewId={viewId?.toString()}
    />
  );
});
