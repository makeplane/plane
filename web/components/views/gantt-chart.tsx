import { FC } from "react";

import { useRouter } from "next/router";

// hooks
import useGanttChartViewIssues from "hooks/gantt-chart/view-issues-view";
import useUser from "hooks/use-user";
import { updateGanttIssue } from "components/gantt-chart/hooks/block-update";
// components
import {
  GanttChartRoot,
  IssueGanttBlock,
  renderIssueBlocksStructure,
} from "components/gantt-chart";
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
        title="Issue Views"
        loaderTitle="Issue Views"
        blocks={ganttIssues ? renderIssueBlocksStructure(ganttIssues as IIssue[]) : null}
        blockUpdateHandler={(block, payload) =>
          updateGanttIssue(block, payload, mutateGanttIssues, user, workspaceSlug?.toString())
        }
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <IssueGanttBlock issue={data as IIssue} />}
      />
    </div>
  );
};
