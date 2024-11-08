import { observer } from "mobx-react";
import { Expand, Shrink } from "lucide-react";
// plane
import { Row } from "@plane/ui";
// components
import { VIEWS_LIST } from "@/components/gantt-chart/data";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { GANTT_BREADCRUMBS_HEIGHT } from "../constants";
import { TGanttViews } from "../types";

type Props = {
  blockIds: string[];
  fullScreenMode: boolean;
  handleChartView: (view: TGanttViews) => void;
  handleToday: () => void;
  loaderTitle: string;
  toggleFullScreenMode: () => void;
  showToday: boolean;
};

export const GanttChartHeader: React.FC<Props> = observer((props) => {
  const { blockIds, fullScreenMode, handleChartView, handleToday, loaderTitle, toggleFullScreenMode, showToday } =
    props;
  // chart hook
  const { currentView } = useTimeLineChartStore();

  return (
    <Row
      className="relative flex w-full flex-shrink-0 flex-wrap items-center gap-2 whitespace-nowrap py-2"
      style={{ height: `${GANTT_BREADCRUMBS_HEIGHT}px` }}
    >
      <div className="ml-auto">
        <div className="ml-auto text-sm font-medium">
          {blockIds ? `${blockIds.length} ${loaderTitle}` : "Loading..."}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {VIEWS_LIST.map((chartView: any) => (
          <div
            key={chartView?.key}
            className={cn("cursor-pointer rounded-sm p-1 px-2 text-xs", {
              "bg-custom-background-80": currentView === chartView?.key,
              "hover:bg-custom-background-90": currentView !== chartView?.key,
            })}
            onClick={() => handleChartView(chartView?.key)}
          >
            {chartView?.title}
          </div>
        ))}
      </div>

      {showToday && (
        <button
          type="button"
          className="rounded-sm p-1 px-2 text-xs hover:bg-custom-background-80"
          onClick={handleToday}
        >
          Today
        </button>
      )}

      <button
        type="button"
        className="flex items-center justify-center rounded-sm border border-custom-border-200 p-1 transition-all hover:bg-custom-background-80"
        onClick={toggleFullScreenMode}
      >
        {fullScreenMode ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </button>
    </Row>
  );
});
