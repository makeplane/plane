import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { ProjectIssueQuickActions } from "components/issues";
import { EIssuesStoreType } from "constants/issue";
import { useIssues } from "hooks/store";
// components
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";
// constants

export interface IViewCalendarLayout {
  issueActions: {
    [EIssueActions.DELETE]: (issue: TIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: TIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: TIssue) => Promise<void>;
    [EIssueActions.ARCHIVE]?: (issue: TIssue) => Promise<void>;
  };
}

export const ProjectViewCalendarLayout: React.FC<IViewCalendarLayout> = observer((props) => {
  const { issueActions } = props;
  // store
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  // router
  const router = useRouter();
  const { viewId } = router.query;

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      viewId={viewId?.toString()}
    />
  );
});
