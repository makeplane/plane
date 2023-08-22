import { useRouter } from "next/router";

// hooks
import useIssuesView from "hooks/use-issues-view";
import useUser from "hooks/use-user";
import useGanttChartCycleIssues from "hooks/gantt-chart/cycle-issues-view";
import { updateGanttIssue } from "components/gantt-chart/hooks/block-update";
// components
import {
  GanttChartRoot,
  IssueGanttBlock,
  renderIssueBlocksStructure,
} from "components/gantt-chart";
// types
import { IIssue } from "types";

export const CycleIssuesGanttChartView = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { orderBy } = useIssuesView();

  const { user } = useUser();

  const { ganttIssues, mutateGanttIssues } = useGanttChartCycleIssues(
    workspaceSlug as string,
    projectId as string,
    cycleId as string
  );

  // rendering issues on gantt sidebar
  const GanttSidebarBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full items-center p-1 overflow-hidden gap-1">
      <div
        className="rounded-sm flex-shrink-0 w-[10px] h-[10px] flex justify-center items-center"
        style={{ backgroundColor: data?.state_detail?.color || "rgb(var(--color-primary-100))" }}
      />
      <div className="text-custom-text-100 text-sm">{data?.name}</div>
    </div>
  );

  return (
    <div className="w-full h-full p-3">
      <GanttChartRoot
        title="Cycles"
        loaderTitle="Cycles"
        blocks={ganttIssues ? renderIssueBlocksStructure(ganttIssues as IIssue[]) : null}
        blockUpdateHandler={(block, payload) =>
          updateGanttIssue(block, payload, mutateGanttIssues, user, workspaceSlug?.toString())
        }
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <IssueGanttBlock issue={data as IIssue} />}
        enableReorder={orderBy === "sort_order"}
      />
    </div>
  );
};
