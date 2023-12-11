import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { IssueGanttBlock, IssuePeekOverview } from "components/issues";
import {
  GanttChartRoot,
  IBlockUpdateData,
  renderIssueBlocksStructure,
  IssueGanttSidebar,
} from "components/gantt-chart";
// types
import { IIssueUnGroupedStructure } from "store/issue";
import { IIssue } from "types";
import {
  ICycleIssuesFilterStore,
  ICycleIssuesStore,
  IModuleIssuesFilterStore,
  IModuleIssuesStore,
  IProjectIssuesFilterStore,
  IProjectIssuesStore,
  IViewIssuesFilterStore,
  IViewIssuesStore,
} from "store/issues";
import { TUnGroupedIssues } from "store/issues/types";
import { EUserWorkspaceRoles } from "constants/workspace";

interface IBaseGanttRoot {
  issueFiltersStore:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore;
  issueStore: IProjectIssuesStore | IModuleIssuesStore | ICycleIssuesStore | IViewIssuesStore;
  viewId?: string;
}

export const BaseGanttRoot: React.FC<IBaseGanttRoot> = observer((props: IBaseGanttRoot) => {
  const { issueFiltersStore, issueStore, viewId } = props;

  const router = useRouter();
  const { workspaceSlug, peekIssueId, peekProjectId } = router.query;

  const {
    user: { currentProjectRole },
  } = useMobxStore();

  const appliedDisplayFilters = issueFiltersStore.issueFilters?.displayFilters;

  const issuesResponse = issueStore.getIssues;
  const issueIds = (issueStore.getIssuesIds ?? []) as TUnGroupedIssues;

  const issues = issueIds.map((id) => issuesResponse?.[id]);

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

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <>
      <div className="h-full w-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blocks={issues ? renderIssueBlocksStructure(issues as IIssueUnGroupedStructure) : null}
          blockUpdateHandler={updateIssueBlockStructure}
          blockToRender={(data: IIssue) => <IssueGanttBlock data={data} />}
          sidebarToRender={(props) => (
            <IssueGanttSidebar
              {...props}
              quickAddCallback={issueStore.quickAddIssue}
              viewId={viewId}
              enableQuickIssueCreate
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
