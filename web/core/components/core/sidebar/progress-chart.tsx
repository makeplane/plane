import React from "react";
import { eachDayOfInterval, isValid } from "date-fns";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { TChartData, TModuleCompletionChartDistribution } from "@plane/types";
// ui
// helpers
import { getDate, renderFormattedDateWithoutYear } from "@/helpers/date-time.helper";
//types

type Props = {
  distribution: TModuleCompletionChartDistribution;
  startDate: string | Date;
  endDate: string | Date;
  totalIssues: number;
  className?: string;
  plotTitle?: string;
};

const styleById = {
  ideal: {
    strokeDasharray: "6, 3",
    strokeWidth: 1,
  },
  default: {
    strokeWidth: 1,
  },
};

const DashedLine = ({ series, lineGenerator, xScale, yScale }: any) =>
  series.map(({ id, data, color }: any) => (
    <path
      key={id}
      d={lineGenerator(
        data.map((d: any) => ({
          x: xScale(d.data.x),
          y: yScale(d.data.y),
        }))
      )}
      fill="none"
      stroke={color ?? "#ddd"}
      style={styleById[id as keyof typeof styleById] || styleById.default}
    />
  ));

const ProgressChart: React.FC<Props> = ({
  distribution,
  startDate,
  endDate,
  totalIssues,
  className = "",
  plotTitle = "work items",
}) => {
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
            label: "Current Completed",
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
            label: "Ideal Completion",
            strokeColor: "#A9BBD0",
            fill: "#A9BBD0",
            fillOpacity: 0,
            showDot: true,
            smoothCurves: true,
            strokeOpacity: 1,
            stackId: "bar-two",
          },
        ]}
        xAxis={{ key: "name", label: "Date" }}
        yAxis={{ key: "current", label: "Current" }}
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
