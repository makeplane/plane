import { observer } from "mobx-react";
import { Expand, Shrink } from "lucide-react";

type Props = {
  fullScreenMode: boolean;
  handleToday: () => void;
  toggleFullScreenMode: () => void;
};

export const GanttChartHeader: React.FC<Props> = observer((props) => {
  const { fullScreenMode, handleToday, toggleFullScreenMode } = props;
  // chart hook

  return (
    <div className="relative flex w-full flex-shrink-0 flex-wrap items-center gap-2 whitespace-nowrap px-2.5 py-2 justify-end">
      <button type="button" className="rounded-sm p-1 px-2 text-xs hover:bg-custom-background-80" onClick={handleToday}>
        Today
      </button>

      <button
        type="button"
        className="flex items-center justify-center rounded-sm border border-custom-border-200 p-1 transition-all hover:bg-custom-background-80"
        onClick={toggleFullScreenMode}
      >
        {fullScreenMode ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </button>
    </div>
  );
});
