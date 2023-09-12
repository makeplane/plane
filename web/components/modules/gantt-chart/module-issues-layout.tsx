import { FC } from "react";

import { useRouter } from "next/router";

// hooks
import useIssuesView from "hooks/use-issues-view";
import useUser from "hooks/use-user";
import useGanttChartModuleIssues from "hooks/gantt-chart/module-issues-view";
import { updateGanttIssue } from "components/gantt-chart/hooks/block-update";
import useProjectDetails from "hooks/use-project-details";
// components
import { GanttChartRoot, renderIssueBlocksStructure } from "components/gantt-chart";
import { IssueGanttBlock, IssueGanttSidebarBlock } from "components/issues";
// types
import { IIssue } from "types";

type Props = {};

export const ModuleIssuesGanttChartView: FC<Props> = ({}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { displayFilters } = useIssuesView();

  const { user } = useUser();
  const { projectDetails } = useProjectDetails();

  const { ganttIssues, mutateGanttIssues } = useGanttChartModuleIssues(
    workspaceSlug as string,
    projectId as string,
    moduleId as string
  );

  const isAllowed = projectDetails?.member_role === 20 || projectDetails?.member_role === 15;

  return (
    <div className="w-full h-full">
      <GanttChartRoot
        border={false}
        title="Issues"
        loaderTitle="Issues"
        blocks={ganttIssues ? renderIssueBlocksStructure(ganttIssues as IIssue[]) : null}
        blockUpdateHandler={(block, payload) =>
          updateGanttIssue(block, payload, mutateGanttIssues, user, workspaceSlug?.toString())
        }
        SidebarBlockRender={IssueGanttSidebarBlock}
        BlockRender={IssueGanttBlock}
        enableBlockLeftResize={isAllowed}
        enableBlockRightResize={isAllowed}
        enableBlockMove={isAllowed}
        enableReorder={displayFilters.order_by === "sort_order" && isAllowed}
        bottomSpacing
      />
    </div>
  );
};
