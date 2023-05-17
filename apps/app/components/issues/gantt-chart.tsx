import { FC } from "react";
// next imports
import { useRouter } from "next/router";
// components
import { GanttChartRoot } from "components/gantt-chart";
// ui
import { Tooltip } from "components/ui";
// hooks
import useGanttChartIssues from "hooks/gantt-chart/issue-view";

type Props = {};

export const IssueGanttChartView: FC<Props> = ({}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { ganttIssues, mutateGanttIssues } = useGanttChartIssues(
    workspaceSlug as string,
    projectId as string
  );

  // rendering issues on gantt sidebar
  const GanttSidebarBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full items-center p-1 overflow-hidden gap-1">
      <div
        className="rounded-sm flex-shrink-0 w-[10px] h-[10px] flex justify-center items-center"
        style={{ backgroundColor: data?.state_detail?.color || `#333` }}
      >
        {" "}
      </div>
      <div className="text-brand-base text-sm lineclamp">{data?.name}</div>
    </div>
  );

  // rendering issues on gantt card
  const GanttBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full items-center p-1 overflow-hidden gap-1">
      <div
        className="rounded-sm flex-shrink-0 w-[10px] h-[10px] flex justify-center items-center"
        style={{ backgroundColor: data?.state_detail?.color || `#333` }}
      >
        {" "}
      </div>
      <div className="inline-block text-brand-base px-1 text-sm whitespace-nowrap lineclamp">
        {data?.name}
      </div>
    </div>
  );

  // handle gannt issue start date and target date
  const handleUpdateDates = (data: any) => {};

  const blockFormat = (blocks: any) =>
    blocks && blocks.length > 0
      ? blocks.map((_block: any) => {
          console.log("_block", _block);
          return {
            start_date: new Date(_block.created_at),
            target_date: new Date(_block.updated_at),
            data: _block,
          };
        })
      : [];

  return (
    <div className="w-full h-full p-3">
      <GanttChartRoot
        title={`Issues`}
        blocks={ganttIssues ? blockFormat(ganttIssues) : null}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <GanttBlockView data={data} />}
      />
    </div>
  );
};
