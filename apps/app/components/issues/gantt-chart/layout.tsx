import { useRouter } from "next/router";
import Link from "next/link";

// hooks
import useIssuesView from "hooks/use-issues-view";
import useUser from "hooks/use-user";
import useGanttChartIssues from "hooks/gantt-chart/issue-view";
import { updateGanttIssue } from "components/gantt-chart/hooks/block-update";
// components
import { GanttChartRoot, renderIssueBlocksStructure } from "components/gantt-chart";
import { IssueGanttBlock, IssueGanttSidebarBlock } from "components/issues";
// icons
import { getStateGroupIcon } from "components/icons";
// helpers
import { findTotalDaysInRange } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

export const IssueGanttChartView = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { orderBy } = useIssuesView();

  const { user } = useUser();

  const { ganttIssues, mutateGanttIssues } = useGanttChartIssues(
    workspaceSlug as string,
    projectId as string
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
        blockRender={(data: any) => <IssueGanttBlock issue={data as IIssue} />}
        sidebarBlockRender={(data: any) => <IssueGanttSidebarBlock issue={data as IIssue} />}
        enableReorder={orderBy === "sort_order"}
      />
    </div>
  );
};
