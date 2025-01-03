import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { Loader as Spinner, ChevronDown } from "lucide-react";
// plane imports
import {
  TStackChartData,
  TStackItem,
  TWorkloadDataKeys,
  TWorkloadXAxisKeys,
  TTeamAnalyticsValueKeys,
} from "@plane/types";
import { Dropdown, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StackedBarChart } from "@/components/core/charts/stacked-bar-chart";
// plane web imports
import { renderFormattedDateWithoutYear } from "@/helpers/date-time.helper";
import { TEAM_WORKLOAD_X_AXIS_LABEL_MAP, TEAM_WORKLOAD_Y_AXIS_LABEL_MAP } from "@/plane-web/constants/teams";
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";

const stacks: TStackItem<TWorkloadDataKeys>[] = [
  {
    key: "completed",
    fillClassName: "fill-[#004EFF]",
    textClassName: "text-white",
    dotClassName: "bg-[#004EFF]",
    showPercentage: true,
  },
  {
    key: "overdue",
    fillClassName: "fill-[#FFCCCC]",
    textClassName: "text-[#FF0000]",
    dotClassName: "bg-[#FFCCCC]",
    showPercentage: true,
  },
  {
    key: "pending",
    fillClassName: "fill-custom-background-80/80",
    textClassName: "text-custom-text-200",
    dotClassName: "bg-custom-background-80/80",
  },
];

const COMMON_DROPDOWN_CONTAINER_CLASSNAME =
  "mx-1.5 px-1.5 bg-custom-background-80/60 rounded text-custom-text-100 font-medium";
const COMMON_CHEVRON_CLASSNAME = "size-3 text-custom-text-400 transition-all";

type TTeamWorkloadChartProps = {
  teamId: string;
  xAxisKey: TWorkloadXAxisKeys;
  yAxisKey: TTeamAnalyticsValueKeys;
  data: TStackChartData<TWorkloadXAxisKeys, TWorkloadDataKeys>[];
  handleXAxisKeyChange: (key: TWorkloadXAxisKeys) => void;
  handleYAxisKeyChange: (key: TTeamAnalyticsValueKeys) => void;
};

const workloadXAxisOptions = Object.entries(TEAM_WORKLOAD_X_AXIS_LABEL_MAP).map(([data, value]) => ({
  data,
  value,
}));
const workloadYAxisOptions = Object.entries(TEAM_WORKLOAD_Y_AXIS_LABEL_MAP).map(([data, value]) => ({
  data,
  value,
}));

export const TeamWorkloadChart: React.FC<TTeamWorkloadChartProps> = observer((props) => {
  const { teamId, data, xAxisKey, yAxisKey, handleXAxisKeyChange, handleYAxisKeyChange } = props;
  // store hooks
  const { getTeamWorkloadLoader } = useTeamAnalytics();
  // derived values
  const loader = getTeamWorkloadLoader(teamId);
  const isLoading = loader && ["init-loader", "mutation"].includes(loader);
  // Format data in case of date
  const modifiedData = useMemo(() => {
    if (["start_date", "target_date"].includes(xAxisKey)) {
      return data.map((item) => ({
        ...item,
        [xAxisKey]:
          item[xAxisKey] && typeof item[xAxisKey] === "string"
            ? renderFormattedDateWithoutYear(item[xAxisKey] as string)
            : item[xAxisKey],
      }));
    }
    return data;
  }, [xAxisKey, data]);

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex items-center text-sm text-custom-text-300">
        Progress on
        <Dropdown
          value={yAxisKey}
          options={workloadYAxisOptions}
          onChange={(value) => handleYAxisKeyChange(value as TTeamAnalyticsValueKeys)}
          keyExtractor={(option) => option.data}
          buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
          buttonContent={(isOpen, value) => (
            <span className="flex items-center gap-1">
              {value && typeof value === "string"
                ? TEAM_WORKLOAD_Y_AXIS_LABEL_MAP[value as TTeamAnalyticsValueKeys]
                : TEAM_WORKLOAD_Y_AXIS_LABEL_MAP[yAxisKey]}
              <ChevronDown className={cn(COMMON_CHEVRON_CLASSNAME, isOpen ? "rotate-180" : "rotate-0")} />
            </span>
          )}
          disableSearch
          disabled={isLoading}
        />
        view by
        <Dropdown
          value={xAxisKey}
          options={workloadXAxisOptions}
          onChange={(value) => handleXAxisKeyChange(value as TWorkloadXAxisKeys)}
          keyExtractor={(option) => option.data}
          buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
          buttonContent={(isOpen, value) => (
            <span className="flex items-center gap-1">
              {value && typeof value === "string"
                ? TEAM_WORKLOAD_X_AXIS_LABEL_MAP[value as TWorkloadXAxisKeys]
                : TEAM_WORKLOAD_X_AXIS_LABEL_MAP[xAxisKey]}
              <ChevronDown className={cn(COMMON_CHEVRON_CLASSNAME, isOpen ? "rotate-180" : "rotate-0")} />
            </span>
          )}
          disableSearch
          disabled={isLoading}
        />
        {isLoading && <Spinner size={14} className="animate-spin flex-shrink-0 mx-1" />}
      </div>
      {loader === "init-loader" ? (
        <Loader className="w-full h-96 flex items-center justify-center">
          <Loader.Item width="96%" height="100%" />
        </Loader>
      ) : (
        <StackedBarChart
          data={modifiedData}
          stacks={stacks}
          xAxis={{
            key: xAxisKey,
            label: TEAM_WORKLOAD_X_AXIS_LABEL_MAP[xAxisKey],
          }}
          yAxis={{
            key: "total",
            label: TEAM_WORKLOAD_Y_AXIS_LABEL_MAP[yAxisKey],
          }}
        />
      )}
    </div>
  );
});
