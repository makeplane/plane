import React from "react";
// plane imports
import { AreaChart } from "@plane/propel/charts/area-chart";
import { TChartData, TModuleCompletionChartDistribution } from "@plane/types";
import { renderFormattedDateWithoutYear } from "@plane/utils";

type Props = {
  distribution: TModuleCompletionChartDistribution;
  totalIssues: number;
  className?: string;
  plotTitle?: string;
};

const ProgressChart: React.FC<Props> = ({ distribution, totalIssues, className = "", plotTitle = "work items" }) => {
  const chartData: TChartData<string, string>[] = Object.keys(distribution ?? []).map((key, index) => ({
    name: renderFormattedDateWithoutYear(key),
    current: distribution[key] ?? 0,
    ideal: totalIssues * (1 - index / (Object.keys(distribution ?? []).length - 1)),
  }));

  return (
    <div className={`flex w-full items-center justify-center ${className}`}>
      <AreaChart
        data={chartData}
        areas={[
          {
            key: "current",
            label: `Current ${plotTitle}`,
            strokeColor: "#3F76FF",
            fill: "#3F76FF33",
            fillOpacity: 1,
            showDot: true,
            smoothCurves: true,
            strokeOpacity: 1,
            stackId: "bar-one",
          },
          {
            key: "ideal",
            label: `Ideal ${plotTitle}`,
            strokeColor: "#A9BBD0",
            fill: "#A9BBD0",
            fillOpacity: 0,
            showDot: true,
            smoothCurves: true,
            strokeOpacity: 1,
            stackId: "bar-two",
            style: {
              strokeDasharray: "6, 3",
              strokeWidth: 1,
            },
          },
        ]}
        xAxis={{ key: "name", label: "Date" }}
        yAxis={{ key: "current", label: "Completion" }}
        margin={{ bottom: 30 }}
        className="h-[370px] w-full"
        legend={{
          align: "center",
          verticalAlign: "bottom",
          layout: "horizontal",
          wrapperStyles: {
            marginTop: 20,
          },
        }}
      />
    </div>
  );
};

export default ProgressChart;
