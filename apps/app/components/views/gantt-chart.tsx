import { FC } from "react";

import { useRouter } from "next/router";

// hooks
import useGanttChartViewIssues from "hooks/gantt-chart/view-issues-view";
import useUser from "hooks/use-user";
import { updateGanttIssue } from "components/gantt-chart/hooks/block-update";
// components
import { GanttChartRoot, renderIssueBlocksStructure } from "components/gantt-chart";
import { IssueGanttBlock, IssueGanttSidebarBlock } from "components/issues";
// types
import { IIssue } from "types";

type Props = {};

export const ViewIssuesGanttChartView: FC<Props> = ({}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const { user } = useUser();

  const { ganttIssues, mutateGanttIssues } = useGanttChartViewIssues(
    workspaceSlug as string,
    projectId as string,
    viewId as string
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
      />
    </div>
  );
};
