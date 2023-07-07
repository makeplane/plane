import { FC } from "react";
// next imports
import Link from "next/link";
import { useRouter } from "next/router";
// components
import { GanttChartRoot } from "components/gantt-chart";
// ui
import { Tooltip } from "components/ui";
// types
import { ICycle } from "types";

type Props = {
  cycles: ICycle[];
};

export const CyclesListGanttChartView: FC<Props> = ({ cycles }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // rendering issues on gantt sidebar
  const GanttSidebarBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full items-center p-1 overflow-hidden gap-1">
      <div
        className="rounded-sm flex-shrink-0 w-[10px] h-[10px] flex justify-center items-center"
        style={{ backgroundColor: "#858e96" }}
      />
      <div className="text-brand-base text-sm">{data?.name}</div>
    </div>
  );

  // rendering issues on gantt card
  const GanttBlockView = ({ data }: { data: ICycle }) => (
    <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${data?.id}`}>
      <a className="relative flex items-center w-full h-full overflow-hidden shadow-sm">
        <div className="flex-shrink-0 w-[4px] h-full" style={{ backgroundColor: "#858e96" }} />
        <Tooltip tooltipContent={data?.name} className={`z-[999999]`}>
          <div className="text-brand-base text-[15px] whitespace-nowrap py-[4px] px-2.5 overflow-hidden w-full">
            {data?.name}
          </div>
        </Tooltip>
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
    <div className="w-full h-full overflow-y-auto">
      <GanttChartRoot
        title={"Cycles"}
        loaderTitle="Cycles"
        blocks={cycles ? blockFormat(cycles) : null}
        blockUpdateHandler={handleUpdateDates}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <GanttBlockView data={data} />}
      />
    </div>
  );
};
