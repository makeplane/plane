import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import useProjectDetails from "hooks/use-project-details";
// components
import { IssueGanttBlock } from "components/issues";
import {
  GanttChartRoot,
  IBlockUpdateData,
  renderIssueBlocksStructure,
  IssueGanttSidebar,
} from "components/gantt-chart";
// types
import { IIssueUnGroupedStructure } from "store/issue";
import { IIssue } from "types";

export const GanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { projectDetails } = useProjectDetails();

  const { issue: issueStore, issueFilter: issueFilterStore } = useMobxStore();

  const appliedDisplayFilters = issueFilterStore.userDisplayFilters;

  const issues = issueStore.getIssues;

  const updateIssue = (block: IIssue, payload: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    issueStore.updateGanttIssueStructure(workspaceSlug.toString(), block, payload);
  };

  const isAllowed = projectDetails?.member_role === 20 || projectDetails?.member_role === 15;

  return (
    <>
      <div className="w-full h-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blocks={issues ? renderIssueBlocksStructure(issues as IIssueUnGroupedStructure) : null}
          blockUpdateHandler={updateIssue}
          blockToRender={(data: IIssue) => <IssueGanttBlock data={data} handleIssue={updateIssue} />}
          sidebarToRender={(props) => <IssueGanttSidebar {...props} enableQuickIssueCreate />}
          enableBlockLeftResize={isAllowed}
          enableBlockRightResize={isAllowed}
          enableBlockMove={isAllowed}
          enableReorder={appliedDisplayFilters.order_by === "sort_order" && isAllowed}
        />
      </div>
    </>
  );
});
