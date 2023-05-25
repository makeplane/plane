import { FC } from "react";
// next imports
import Link from "next/link";
import { useRouter } from "next/router";
// components
import { GanttChartRoot } from "components/gantt-chart";
// hooks
import useGanttChartCycleIssues from "hooks/gantt-chart/cycle-issues-view";

type Props = {};

export const CycleIssuesGanttChartView: FC<Props> = ({}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

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
        style={{ backgroundColor: data?.state_detail?.color || "#858e96" }}
      />
      <div className="text-brand-base text-sm">{data?.name}</div>
    </div>
  );

  // rendering issues on gantt card
  const GanttBlockView = ({ data }: any) => (
    <Link href={`/${workspaceSlug}/projects/${projectId}/issues/${data?.id}`}>
      <a className="relative flex items-center w-full h-full overflow-hidden shadow-sm">
        <div
          className="flex-shrink-0 w-[4px] h-full"
          style={{ backgroundColor: data?.state_detail?.color || "#858e96" }}
        />
        <div className="w-full text-brand-base text-[15px] whitespace-nowrap py-[4px] px-2.5 overflow-hidden">
          {data?.name}
        </div>
      </a>
    </Link>
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
        title="Cycles"
        loaderTitle="Cycles"
        blocks={ganttIssues ? blockFormat(ganttIssues) : null}
        blockUpdateHandler={handleUpdateDates}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <GanttBlockView data={data} />}
      />
    </div>
  );
};
