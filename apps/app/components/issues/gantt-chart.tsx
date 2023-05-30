import { FC, useState, useEffect } from "react";
// next imports
import Link from "next/link";
import { useRouter } from "next/router";
// components
import { GanttChartRoot } from "components/gantt-chart";
// ui
import { Tooltip } from "components/ui";
// hooks
import useGanttChartIssues from "hooks/gantt-chart/issue-view";

// types
import type { IIssue } from "types";

type Props = {};

export const IssueGanttChartView: FC<Props> = ({}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { ganttIssues } = useGanttChartIssues(workspaceSlug as string, projectId as string);

  const [blocks, setBlocks] = useState<any>([]);

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
      <a className="relative flex items-center w-full h-full overflow-hidden shadow-sm font-normal">
        <div
          className="flex-shrink-0 w-[4px] h-full"
          style={{ backgroundColor: data?.state_detail?.color || "#858e96" }}
        />
        <Tooltip tooltipContent={data?.name} className={`z-[999999]`}>
          <div className="text-brand-base text-[15px] whitespace-nowrap py-[4px] px-2.5 overflow-hidden w-full">
            {data?.name}
          </div>
        </Tooltip>
        {data.infoToggle && (
          <Tooltip
            tooltipContent={`No due-date set, rendered according to last updated date.`}
            className={`z-[999999]`}
          >
            <div className="flex-shrink-0 mx-2 w-[18px] h-[18px] overflow-hidden flex justify-center items-center">
              <span className="material-symbols-rounded text-brand-secondary text-[18px]">
                info
              </span>
            </div>
          </Tooltip>
        )}
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

    setBlocks((prevData: any) => {
      if (!Array.isArray(prevData)) return {};
      const newData = [...(prevData ?? [])];
      const index = newData.findIndex((item) => item.id === data?.id);

      newData[index] = { ...newData[index], ...payload, ...data };

      return newData;
    });
  };

  const blockFormat = (blocks: IIssue[] | undefined) => {
    if (!blocks || blocks.length === 0) return [];

    // FIXME: group by will be handled by backend
    const uniqueStates = [
      ...(new Set(blocks.map((block) => block.state_detail?.id)) as any),
    ].sort();

    return blocks
      .map((block: IIssue) => {
        let startDate = new Date(block.created_at);
        let targetDate = new Date(block.updated_at);
        let infoToggle = true;

        if (block?.start_date && block.target_date) {
          startDate = new Date(block?.start_date);
          targetDate = new Date(block.target_date);
          infoToggle = false;
        }

        return {
          start_date: new Date(startDate),
          target_date: new Date(targetDate),
          infoToggle: infoToggle,
          renderOnlyOnSideBar: startDate === null || targetDate === null,
          data: block,
        };
      })
      .sort((a, b) => {
        const stateA = uniqueStates.indexOf(a.data.state_detail?.id);
        const stateB = uniqueStates.indexOf(b.data.state_detail?.id);

        return stateA - stateB;
      });
  };

  useEffect(() => {
    if (ganttIssues) setBlocks(blockFormat(ganttIssues as any[]));
  }, [ganttIssues]);

  return (
    <div className="w-full h-full">
      <GanttChartRoot
        border={false}
        title="Issues"
        loaderTitle="Issues"
        blocks={blocks}
        blockUpdateHandler={handleUpdateDates}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <GanttBlockView data={data} />}
      />
    </div>
  );
};
