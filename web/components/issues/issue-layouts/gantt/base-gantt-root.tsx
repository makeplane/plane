import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues, useUser } from "hooks/store";
// components
import { IssueGanttBlock, IssuePeekOverview } from "components/issues";
import {
  GanttChartRoot,
  IBlockUpdateData,
  renderIssueBlocksStructure,
  IssueGanttSidebar,
} from "components/gantt-chart";
// types
import { IIssue, TUnGroupedIssues } from "types";
import { EUserProjectRoles } from "constants/project";
import { ICycleIssues, ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssues, IModuleIssuesFilter } from "store/issue/module";
import { IProjectIssues, IProjectIssuesFilter } from "store/issue/project";
import { IProjectViewIssues, IProjectViewIssuesFilter } from "store/issue/project-views";

interface IBaseGanttRoot {
  issueFiltersStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  issueStore: IProjectIssues | IModuleIssues | ICycleIssues | IProjectViewIssues;
  viewId?: string;
}

export const BaseGanttRoot: React.FC<IBaseGanttRoot> = observer((props: IBaseGanttRoot) => {
  const { issueFiltersStore, issueStore, viewId } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, peekIssueId, peekProjectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { issueMap } = useIssues();
  const appliedDisplayFilters = issueFiltersStore.issueFilters?.displayFilters;

  const issueIds = (issueStore.groupedIssueIds ?? []) as TUnGroupedIssues;
  const { enableIssueCreation } = issueStore?.viewFlags || {};

  const issues = issueIds.map((id) => issueMap?.[id]);

  const updateIssueBlockStructure = async (issue: IIssue, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await issueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, payload, viewId);
  };

  const updateIssue = async (projectId: string, issueId: string, payload: Partial<IIssue>) => {
    if (!workspaceSlug) return;

    await issueStore.updateIssue(workspaceSlug.toString(), projectId, issueId, payload, viewId);
  };

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <>
      <div className="h-full w-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blocks={issues ? renderIssueBlocksStructure(issues as IIssue[]) : null}
          blockUpdateHandler={updateIssueBlockStructure}
          blockToRender={(data: IIssue) => <IssueGanttBlock data={data} />}
          sidebarToRender={(props) => (
            <IssueGanttSidebar
              {...props}
              quickAddCallback={issueStore.quickAddIssue}
              viewId={viewId}
              enableQuickIssueCreate
              disableIssueCreation={!enableIssueCreation || !isAllowed}
            />
          )}
          enableBlockLeftResize={isAllowed}
          enableBlockRightResize={isAllowed}
          enableBlockMove={isAllowed}
          enableReorder={appliedDisplayFilters?.order_by === "sort_order" && isAllowed}
        />
      </div>
      {workspaceSlug && peekIssueId && peekProjectId && (
        <IssuePeekOverview
          workspaceSlug={workspaceSlug.toString()}
          projectId={peekProjectId.toString()}
          issueId={peekIssueId.toString()}
          handleIssue={async (issueToUpdate) => {
            await updateIssue(peekProjectId.toString(), peekIssueId.toString(), issueToUpdate);
          }}
        />
      )}
    </>
  );
});
