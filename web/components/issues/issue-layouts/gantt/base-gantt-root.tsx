import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
// components
import { IssueGanttBlock, IssuePeekOverview } from "components/issues";
import {
  GanttChartRoot,
  IBlockUpdateData,
  renderIssueBlocksStructure,
  IssueGanttSidebar,
} from "components/gantt-chart";
// types
import { IIssueUnGroupedStructure } from "store_legacy/issue";
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
<<<<<<< HEAD
} from "store_legacy/issues";
import { TUnGroupedIssues } from "store_legacy/issues/types";
import { EUserProjectRoles } from "constants/project";
=======
} from "store/issues";
import { TUnGroupedIssues } from "store/issues/types";
import { EIssueActions } from "../types";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434

interface IBaseGanttRoot {
  issueFiltersStore:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore;
  issueStore: IProjectIssuesStore | IModuleIssuesStore | ICycleIssuesStore | IViewIssuesStore;
  viewId?: string;
  issueActions: {
    [EIssueActions.DELETE]: (issue: IIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: IIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: IIssue) => Promise<void>;
  };
}

export const BaseGanttRoot: React.FC<IBaseGanttRoot> = observer((props: IBaseGanttRoot) => {
<<<<<<< HEAD
  const { issueFiltersStore, issueStore, viewId } = props;
  // router
=======
  const { issueFiltersStore, issueStore, viewId, issueActions } = props;

>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
  const router = useRouter();
  const { workspaceSlug, peekIssueId, peekProjectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();

  const appliedDisplayFilters = issueFiltersStore.issueFilters?.displayFilters;

  const issuesResponse = issueStore.getIssues;
  const issueIds = (issueStore.getIssuesIds ?? []) as TUnGroupedIssues;
  const { enableIssueCreation } = issueStore?.viewFlags || {};

  const issues = issueIds.map((id) => issuesResponse?.[id]);

  const updateIssueBlockStructure = async (issue: IIssue, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await issueStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, payload, viewId);
  };

  const handleIssues = useCallback(
    async (issue: IIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        await issueActions[action]!(issue);
      }
    },
    [issueActions]
  );

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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
          handleIssue={async (issueToUpdate, action) => {
            await handleIssues(issueToUpdate as IIssue, action);
          }}
        />
      )}
    </>
  );
});
