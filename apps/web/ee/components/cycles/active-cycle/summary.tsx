import { format, startOfToday } from "date-fns";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
// plane imports
import { TWorkItemFilterCondition } from "@plane/shared-state";
import { TCycleEstimateSystemAdvanced, TCycleProgress, TStateGroups } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { ESTIMATE_TYPE } from "@/plane-web/constants/cycle";
// local imports
import { getColors } from "./cycle-chart/helper";
import { summaryDataFormatter } from "./formatter";
import ScopeDelta from "./scope-delta";

type StateGroupItem = {
  groupLabel: string;
  key: string;
  showBg?: boolean;
  dashed?: boolean;
  color?: string;
  stateGroups?: TStateGroups[];
};

type TSummaryStateGroups = {
  primaryStates: StateGroupItem[];
  secondaryStates: StateGroupItem[];
};

type Props = {
  data: Partial<TCycleProgress>[] | null;
  plotType: string;
  estimateType: TCycleEstimateSystemAdvanced | undefined;
  parentWidth?: number;
  setAreaToHighlight: (area: string) => void;
  handleFiltersUpdate: (conditions: TWorkItemFilterCondition[]) => void;
};

const Summary = observer((props: Props) => {
  const { setAreaToHighlight, data, plotType, estimateType = "issues", handleFiltersUpdate, parentWidth } = props;
  // store hooks
  const { resolvedTheme } = useTheme();
  // derived values
  const today = format(startOfToday(), "yyyy-MM-dd");
  const dataToday = data?.find((d) => d.date === today);
  const isBehind =
    dataToday &&
    (plotType === "burndown" ? dataToday.ideal! < dataToday.actual! : dataToday.ideal! > dataToday.actual!);
  const colors = getColors(resolvedTheme);
  const estimateTypeFormatter = summaryDataFormatter(estimateType);

  const scopeChangeCount = data?.reduce((acc, curr, index, array) => {
    // Skip the first element as there's nothing to compare it with
    if (index === 0) return acc;

    // Compare current scope with the previous scope
    if (curr.scope !== array[index - 1].scope && today >= curr.date!) {
      return acc + 1;
    }

    return acc;
  }, 0);

  const stateGroups: TSummaryStateGroups = {
    primaryStates: [
      {
        groupLabel: `Today's ideal ${plotType === "burndown" ? "Pending" : "Done"}`,
        key: "ideal",
        showBg: false,
        dashed: true,
        color: colors.idealStroke,
      },
      {
        groupLabel: plotType === "burndown" ? "Pending" : "Done",
        key: "actual",
        showBg: true,
        color: colors.actual,
        stateGroups: plotType === "burndown" ? ["started", "unstarted", "backlog"] : ["completed"],
      },
      {
        groupLabel: "Started",
        key: "started",
        showBg: true,
        color: colors.startedStroke,
        stateGroups: ["started"],
      },
      {
        groupLabel: "Scope",
        key: "scope",
        showBg: false,
        color: colors.scopeStroke,
        stateGroups: ["started", "unstarted", "backlog", "completed"],
      },
    ],
    secondaryStates: [
      {
        groupLabel: plotType !== "burndown" ? "Pending" : "Done",
        key: plotType !== "burndown" ? "pending" : "completed",
        stateGroups: plotType !== "burndown" ? ["started", "unstarted", "backlog"] : ["completed"],
      },
      { groupLabel: "Unstarted", key: "unstarted", stateGroups: ["unstarted"] },
      { groupLabel: "Backlog", key: "backlog", stateGroups: ["backlog"] },
    ],
  };

  return (
    <div
      className={cn("py-4 pr-6 w-full md:min-w-[250px]", {
        "md:w-[300px] md:border-r border-custom-border-200": parentWidth && parentWidth > 890,
      })}
    >
      <div className="text-xs text-custom-text-350 font-medium">
        Breakdown of this cycle&rsquo;s {ESTIMATE_TYPE[estimateType]}
      </div>
      <div
        className={cn("border-b border-custom-border-200 w-full flex text-red-500 py-2", {
          "text-green-500": !isBehind,
        })}
      >
        {!data ? (
          <Loader.Item width="100px" height="20px" />
        ) : dataToday ? (
          <>
            {isBehind ? <TrendingDown className=" mr-2" /> : <TrendingUp className=" mr-2" />}
            <div className="text-md font-medium  flex-1">
              {isBehind ? "Trailing" : "Leading"} by{" "}
              {estimateTypeFormatter(Math.abs((dataToday?.ideal ?? 0) - (dataToday?.actual ?? 0)))}{" "}
              {estimateType !== "time" && ESTIMATE_TYPE[estimateType]}
            </div>
            <div className="text-[20px] self-end">🏃</div>
          </>
        ) : (
          <div className={cn("text-md font-medium  text-custom-text-300")}>No Data</div>
        )}
      </div>

      <div className="space-y-1 mt-2 pb-4 border-b border-custom-border-200">
        <div className="flex text-xs text-custom-text-350 font-medium">
          <span className="capitalize">
            {ESTIMATE_TYPE[estimateType]} <span className="lowercase">by stategroups on chart</span>
          </span>
        </div>
        {stateGroups.primaryStates.map((group, index) => (
          <div
            key={index}
            className={cn("flex text-sm w-full justify-between p-2 rounded hover:bg-custom-background-90", {
              "cursor-default": group.stateGroups,
            })}
            onMouseEnter={() => setAreaToHighlight(group.key)}
            onMouseLeave={() => setAreaToHighlight("")}
            onClick={() => {
              if (group.stateGroups) {
                handleFiltersUpdate([{ property: "state_group", operator: "in", value: group.stateGroups }]);
              }
            }}
          >
            <div className="flex">
              <hr
                className={cn(`my-auto border-[1px]  w-[12px] ${group.dashed && "border-dashed"} mr-2`)}
                style={{ borderColor: group.color }}
              />
              <span className="my-auto">{group.groupLabel}</span>
            </div>
            <div className="flex gap-2">
              {group.key === "scope" && <ScopeDelta data={data} dataToday={dataToday} />}
              <span className="text-end font-bold text-custom-text-300">
                {!data ? (
                  <Loader.Item width="20px" height="20px" />
                ) : (
                  <span
                    className={`py-0.5 rounded  ${group.showBg ? (resolvedTheme?.includes("dark") ? `px-1 text-black` : `px-1 text-white`) : `text-custom-text-350`}`}
                    style={{ backgroundColor: group.showBg ? group.color : "" }}
                  >
                    {dataToday && estimateTypeFormatter(dataToday[group.key as keyof TCycleProgress] as number)}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1 mt-2 pb-4 border-b border-custom-border-200">
        <div className="flex text-xs text-custom-text-350 font-medium">
          <span>Other stategroups</span>
        </div>
        {stateGroups.secondaryStates.map((group, index) => (
          <div
            className={cn("flex text-sm p-2 rounded hover:bg-custom-background-90 justify-between", {
              "cursor-default": group.stateGroups,
            })}
            key={index}
            onClick={() => {
              if (group.stateGroups) {
                handleFiltersUpdate([{ property: "state_group", operator: "in", value: group.stateGroups }]);
              }
            }}
          >
            <span>{group.groupLabel}</span>
            <span className="text-end font-bold text-custom-text-350 flex justify-end flex-shrink-0">
              {!data ? (
                <Loader.Item width="20px" height="20px" />
              ) : (
                dataToday && estimateTypeFormatter(dataToday[group.key as keyof TCycleProgress] as number)
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="text-xs text-custom-text-350 font-medium flex pt-2 gap-2">
        <Info className="text-xs mt-[2px]" size={12} />
        <div className="flex flex-col space-y-2">
          {!data ? (
            <Loader.Item width="200px" height="20px" />
          ) : (
            <span>
              Excluded {estimateTypeFormatter(dataToday?.cancelled)} cancelled{" "}
              {estimateType === "issues" && "work items"}
            </span>
          )}
          {!data ? (
            <Loader.Item width="200px" height="20px" />
          ) : scopeChangeCount ? (
            <span>
              Scope has changed
              {scopeChangeCount === 1 ? " once" : null}
              {scopeChangeCount === 2 ? " twice" : null}
              {scopeChangeCount > 2 ? ` ${scopeChangeCount} times` : null}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
});
export default Summary;
