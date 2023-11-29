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

  const updateIssue = (issue: IIssue, payload: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    //Todo fix sort order in the structure
    issueStore.updateIssue(
      workspaceSlug.toString(),
      issue.project,
      issue.id,
      {
        start_date: payload.start_date,
        target_date: payload.target_date,
      },
      viewId
    );
  };

  const isAllowed = currentProjectRole && currentProjectRole >= 15;

  return (
    <>
      <div className="w-full h-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blocks={issues ? renderIssueBlocksStructure(issues as IIssueUnGroupedStructure) : null}
          blockUpdateHandler={updateIssue}
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
          handleIssue={(issueToUpdate) => {
            // TODO: update the logic here
            updateIssue(issueToUpdate as IIssue, {});
          }}
        />
      )}
    </>
  );
});
