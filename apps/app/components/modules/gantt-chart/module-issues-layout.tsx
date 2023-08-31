import { FC } from "react";

import { useRouter } from "next/router";

// hooks
import useIssuesView from "hooks/use-issues-view";
import useUser from "hooks/use-user";
import useGanttChartModuleIssues from "hooks/gantt-chart/module-issues-view";
import { updateGanttIssue } from "components/gantt-chart/hooks/block-update";
// components
import { GanttChartRoot, renderIssueBlocksStructure } from "components/gantt-chart";
import { IssueGanttBlock, IssueGanttSidebarBlock } from "components/issues";
// types
import { IIssue } from "types";

type Props = {};

export const ModuleIssuesGanttChartView: FC<Props> = ({}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { orderBy } = useIssuesView();

  const { user } = useUser();

  const { ganttIssues, mutateGanttIssues } = useGanttChartModuleIssues(
    workspaceSlug as string,
    projectId as string,
    moduleId as string
  );

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
        enableReorder={orderBy === "sort_order"}
        bottomSpacing
      />
    </div>
  );
};
