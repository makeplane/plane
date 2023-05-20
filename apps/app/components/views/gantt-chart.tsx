import { FC } from "react";

import { useRouter } from "next/router";

// components
import { GanttChartRoot } from "components/gantt-chart";
// hooks
import useGanttChartViewIssues from "hooks/gantt-chart/view-issues-view";

type Props = {};

export const ViewIssuesGanttChartView: FC<Props> = ({}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

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
        style={{ backgroundColor: data?.state_detail?.color || "#858e96" }}
      />
      <div className="text-brand-base text-sm">{data?.name}</div>
    </div>
  );

  // rendering issues on gantt card
  const GanttBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full overflow-hidden">
      <div
        className="flex-shrink-0 w-[4px] h-auto"
        style={{ backgroundColor: data?.state_detail?.color || "#858e96" }}
      />
      <div className="inline-block text-brand-base text-sm whitespace-nowrap py-[4px] px-1.5">
        {data?.name}
      </div>
    </div>
  );

  // handle gantt issue start date and target date
  const handleUpdateDates = async (data: any) => {
    const payload = {
      id: data?.id,
      start_date: data?.start_date,
      target_date: data?.target_date,
    };

    console.log("payload", payload);
  };

  const blockFormat = (blocks: any) =>
    blocks && blocks.length > 0
      ? blocks.map((_block: any) => {
          if (_block?.start_date && _block.target_date) console.log("_block", _block);
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
        title="Issue Views"
        loaderTitle="Issue Views"
        blocks={ganttIssues ? blockFormat(ganttIssues) : null}
        blockUpdateHandler={handleUpdateDates}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <GanttBlockView data={data} />}
      />
    </div>
  );
};
