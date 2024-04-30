import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { TIssue, TUnGroupedIssues } from "@plane/types";
// hooks
import { GanttChartRoot, IBlockUpdateData, IssueGanttSidebar } from "@/components/gantt-chart";
import { GanttQuickAddIssueForm, IssueGanttBlock } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { renderIssueBlocksStructure } from "@/helpers/issue.helper";
import { useIssues, useUser } from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// components
// helpers
// types
// constants

type GanttStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW;
interface IBaseGanttRoot {
  viewId?: string;
  storeType: GanttStoreType;
}

export const BaseGanttRoot: React.FC<IBaseGanttRoot> = observer((props: IBaseGanttRoot) => {
  const { viewId, storeType } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { issues, issuesFilter } = useIssues(storeType);
  const { updateIssue } = useIssuesActions(storeType);
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { issueMap } = useIssues();
  const appliedDisplayFilters = issuesFilter.issueFilters?.displayFilters;

  const issueIds = (issues.groupedIssueIds ?? []) as TUnGroupedIssues;
  const { enableIssueCreation } = issues?.viewFlags || {};

  const issuesArray = issueIds.map((id) => issueMap?.[id]);

  const updateIssueBlockStructure = async (issue: TIssue, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    updateIssue && (await updateIssue(issue.project_id, issue.id, payload));
  };

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <>
      <div className="h-full w-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blocks={issues ? renderIssueBlocksStructure(issuesArray) : null}
          blockUpdateHandler={updateIssueBlockStructure}
          blockToRender={(data: TIssue) => <IssueGanttBlock issueId={data.id} />}
          sidebarToRender={(props) => <IssueGanttSidebar {...props} showAllBlocks />}
          enableBlockLeftResize={isAllowed}
          enableBlockRightResize={isAllowed}
          enableBlockMove={isAllowed}
          enableReorder={appliedDisplayFilters?.order_by === "sort_order" && isAllowed}
          enableAddBlock={isAllowed}
          quickAdd={
            enableIssueCreation && isAllowed ? (
              <GanttQuickAddIssueForm quickAddCallback={issues.quickAddIssue} viewId={viewId} />
            ) : undefined
          }
          showAllBlocks
        />
      </div>
    </>
  );
});
