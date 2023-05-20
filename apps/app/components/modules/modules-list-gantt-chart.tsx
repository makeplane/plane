import { FC } from "react";

// components
import { GanttChartRoot } from "components/gantt-chart";
// types
import { IModule } from "types";
// constants
import { MODULE_STATUS } from "constants/module";

type Props = {
  modules: IModule[];
};

export const ModulesListGanttChartView: FC<Props> = ({ modules }) => {
  // rendering issues on gantt sidebar
  const GanttSidebarBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full items-center p-1 overflow-hidden gap-1">
      <div
        className="rounded-sm flex-shrink-0 w-[10px] h-[10px] flex justify-center items-center"
        style={{
          backgroundColor: MODULE_STATUS.find((s) => s.value === data.status)?.color,
        }}
      />
      <div className="text-brand-base text-sm">{data?.name}</div>
    </div>
  );

  // rendering issues on gantt card
  const GanttBlockView = ({ data }: { data: IModule }) => (
    <div className="relative flex w-full h-full overflow-hidden">
      <div
        className="flex-shrink-0 w-[4px] h-auto"
        style={{ backgroundColor: MODULE_STATUS.find((s) => s.value === data.status)?.color }}
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
        title="Modules"
        loaderTitle="Modules"
        blocks={modules ? blockFormat(modules) : null}
        blockUpdateHandler={handleUpdateDates}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <GanttBlockView data={data} />}
      />
    </div>
  );
};
