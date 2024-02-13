import { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues } from "hooks/store";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";
// types
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssue,
  TIssueKanbanFilters,
} from "@plane/types";
import { EIssueActions } from "../../types";
// constants
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export interface IViewCalendarLayout {
  issueActions: {
    [EIssueActions.DELETE]: (issue: TIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: TIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: TIssue) => Promise<void>;
  };
}

export const ProjectViewCalendarLayout: React.FC<IViewCalendarLayout> = observer((props) => {
  const { issueActions } = props;
  // store
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  // router
  const router = useRouter();
  const { viewId } = router.query;

  const updateFilters = useCallback(
    async (
      workspaceSlug: string,
      projectId: string,
      filterType: EIssueFilterType,
      filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
    ) => {
      if (!viewId) return;
      await issuesFilter.updateFilters(workspaceSlug, projectId, filterType, filters, viewId.toString());
    },
    [viewId, issuesFilter.updateFilters]
  );

  const updateIssue = useCallback(
    async (workspaceSlug: string, projectId: string, issueId: string, payload: Partial<TIssue>) => {
      if (!viewId) return;
      return await issues.updateIssue(workspaceSlug, projectId, issueId, payload, viewId.toString());
    },
    [issues.updateIssue, viewId]
  );

  return (
    <BaseCalendarRoot
      issueStore={issues}
      issuesFilterStore={issuesFilter}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      viewId={viewId?.toString()}
      updateFilters={updateFilters}
      updateIssue={updateIssue}
    />
  );
});
