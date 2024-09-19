import { cn } from "@plane/editor";
import { TCycleProgress } from "@plane/types";
import { groupBy } from "lodash";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { observer } from "mobx-react";

type Props = {
  setAreaToHighlight: (area: string) => void;
  data: TCycleProgress[];
  plotType: string;
  estimateType: string;
};
const Summary = observer((props: Props) => {
  const { setAreaToHighlight, data, plotType, estimateType } = props;
  const dataToday = data[data.length - 1];
  const isBehind = dataToday.ideal < dataToday.actual;

  const scopeChangeCount = data.reduce((acc, curr, index, array) => {
    // Skip the first element as there's nothing to compare it with
    if (index === 0) return acc;

    // Compare current scope with the previous scope
    if (curr.scope !== array[index - 1].scope) {
      return acc + 1;
    }

    return acc;
  }, 0);

  return (
    <div className="md:w-[350px] md:border-r border-custom-border-200 py-4 pr-6">
      <div className="text-xs text-custom-text-400 font-medium">Summary of cycle issues</div>
      <div
        className={cn("border-b border-custom-border-200 w-full flex text-red-500 pb-2", {
          "text-green-500": !isBehind,
        })}
      >
        {isBehind ? <TrendingDown className="my-auto mr-2" /> : <TrendingUp className="my-auto mr-2" />}
        <div className="text-md font-medium my-auto flex-1">
          {isBehind ? "Trailing" : "Leading"} by {Math.abs(dataToday.ideal - dataToday.actual)}{" "}
          {Math.abs(dataToday.ideal - dataToday.actual) > 1 ? estimateType : estimateType.slice(0, -1)}
        </div>
        <div className="text-[20px] self-end">🏃</div>
      </div>
      <div className="space-y-4 mt-2 pb-4 border-b border-custom-border-200">
        <div className="flex text-xs text-custom-text-400 font-medium">
          <span className="w-5/6 capitalize">{estimateType.slice(0, -1)} states on chart</span>
          <span className="w-1/6 text-end capitalize">{estimateType}</span>
        </div>
        <div
          className="flex text-sm"
          onMouseEnter={() => setAreaToHighlight("ideal")}
          onMouseDown={() => setAreaToHighlight("")}
        >
          <hr className="my-auto border-[1px] border-dashed w-[12px] border-indigo-400 mr-2"></hr>
          <span className="w-5/6">Today’s ideal {plotType === "burndown" ? "Pending" : "Done"}</span>
          <span className="w-1/6 text-end font-bold text-custom-text-300">{dataToday.ideal}</span>
        </div>
        <div
          className="flex text-sm w-full justify-between"
          onMouseEnter={() => setAreaToHighlight("actual")}
          onMouseLeave={() => setAreaToHighlight("")}
        >
          <div className="flex">
            <hr className="my-auto h-[2px] border-0 w-[12px] bg-green-400 mr-2"></hr>
            <span className="w-5/6 my-auto">{plotType === "burndown" ? "Pending" : "Done"}</span>
          </div>
          <span className="text-end font-bold text-custom-text-300 bg-green-400 py-0.5 px-1 rounded text-white">
            {dataToday.actual}
          </span>
        </div>
        <div
          className="flex text-sm w-full justify-between"
          onMouseEnter={() => setAreaToHighlight("started")}
          onMouseLeave={() => setAreaToHighlight("")}
        >
          <div className="flex">
            <hr className="my-auto h-[2px] border-0 w-[12px] bg-orange-500 mr-2"></hr>
            <span className="w-5/6 my-auto">Started</span>
          </div>
          <span className="text-end font-bold text-custom-text-300 bg-orange-500 py-0.5 px-1 rounded text-white">
            {dataToday.started}
          </span>{" "}
        </div>
        <div
          className="flex text-sm"
          onMouseEnter={() => setAreaToHighlight("scope")}
          onMouseLeave={() => setAreaToHighlight("")}
        >
          <hr className="my-auto h-[2px] border-0 w-[12px] bg-blue-500 mr-2"></hr>
          <span className="w-5/6">Scope</span>
          <span className="w-1/6 text-end font-bold text-custom-text-300">{dataToday.scope}</span>
        </div>
      </div>
      <div className="space-y-4 mt-2 pb-4 border-b border-custom-border-200">
        <div className="flex text-xs text-custom-text-400 font-medium">
          <span className="w-5/6">Other {estimateType.slice(0, -1)} states</span>
        </div>
        <div className="flex text-sm">
          <span className="w-5/6">Unstarted</span>
          <span className="w-1/6 text-end font-bold text-custom-text-300">{dataToday.unstarted}</span>
        </div>
        <div className="flex text-sm">
          <span className="w-5/6">Backlog</span>
          <span className="w-1/6 text-end font-bold text-custom-text-300">{dataToday.backlog}</span>
        </div>
      </div>
      <div className="text-xs text-custom-text-400 font-medium flex pt-2 gap-2">
        <Info className="text-xs mt-[2px]" size={12} />
        <div className="flex flex-col space-y-2">
          <span>
            {dataToday.cancelled} Cancelled {estimateType} (excluded)
          </span>
          <span>
            Scope has changed {scopeChangeCount} {scopeChangeCount === 1 ? "time" : "times"}
          </span>
        </div>
      </div>
    </div>
  );
});
export default Summary;
