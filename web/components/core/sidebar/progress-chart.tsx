import React from "react";
import { eachDayOfInterval, isValid } from "date-fns";
import { TCompletionChartDistribution } from "@plane/types";
// ui
import { LineGraph } from "@/components/ui";
// helpers
import { getDate, renderFormattedDateWithoutYear } from "@/helpers/date-time.helper";
//types

type Props = {
  distribution: TCompletionChartDistribution;
  startDate: string | Date;
  endDate: string | Date;
  totalIssues: number;
  className?: string;
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

const ProgressChart: React.FC<Props> = ({ distribution, startDate, endDate, totalIssues, className = "" }) => {
  const chartData = Object.keys(distribution ?? []).map((key) => ({
    currentDate: renderFormattedDateWithoutYear(key),
    pending: distribution[key],
  }));

  const generateXAxisTickValues = () => {
    const start = getDate(startDate);
    const end = getDate(endDate);

    let dates: Date[] = [];
    if (start && end && isValid(start) && isValid(end)) {
      dates = eachDayOfInterval({ start, end });
    }

    if (dates.length === 0) return [];

    const formattedDates = dates.map((d) => renderFormattedDateWithoutYear(d));
    const firstDate = formattedDates[0];
    const lastDate = formattedDates[formattedDates.length - 1];

    if (formattedDates.length <= 2) return [firstDate, lastDate];

    const middleDateIndex = Math.floor(formattedDates.length / 2);
    const middleDate = formattedDates[middleDateIndex];

    return [firstDate, middleDate, lastDate];
  };

  return (
    <div className={`flex w-full items-center justify-center ${className}`}>
      <LineGraph
        animate
        curve="monotoneX"
        height="160px"
        width="100%"
        enableGridY={false}
        lineWidth={1}
        margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
        data={[
          {
            id: "pending",
            color: "#3F76FF",
            data:
              chartData.length > 0
                ? chartData.map((item, index) => ({
                    index,
                    x: item.currentDate,
                    y: item.pending,
                    color: "#3F76FF",
                  }))
                : [],
            enableArea: true,
          },
          {
            id: "ideal",
            color: "#a9bbd0",
            fill: "transparent",
            data:
              chartData.length > 0
                ? [
                    {
                      x: chartData[0].currentDate,
                      y: totalIssues,
                    },
                    {
                      x: chartData[chartData.length - 1].currentDate,
                      y: 0,
                    },
                  ]
                : [],
          },
        ]}
        layers={["grid", "markers", "areas", DashedLine, "slices", "points", "axes", "legends"]}
        axisBottom={{
          tickValues: generateXAxisTickValues(),
        }}
        enablePoints={false}
        enableArea
        colors={(datum) => datum.color ?? "#3F76FF"}
        customYAxisTickValues={[0, totalIssues]}
        gridXValues={
          chartData.length > 0 ? chartData.map((item, index) => (index % 2 === 0 ? item.currentDate : "")) : undefined
        }
        enableSlices="x"
        sliceTooltip={(datum) => (
          <div className="rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
            {datum.slice.points[0].data.yFormatted}
            <span className="text-custom-text-200"> issues pending on </span>
            {datum.slice.points[0].data.xFormatted}
          </div>
        )}
        theme={{
          background: "transparent",
          axis: {
            domain: {
              line: {
                stroke: "rgb(var(--color-border))",
                strokeWidth: 1,
              },
            },
          },
        }}
      />
    </div>
  );
};

export default ProgressChart;
