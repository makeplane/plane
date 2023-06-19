import React from "react";

// ui
import { LineGraph } from "components/ui";
// helpers
import { getDatesInRange, renderShortNumericDateFormat } from "helpers/date-time.helper";
//types
import { IIssue } from "types";

type Props = {
  issues: IIssue[];
  start: string;
  end: string;
  width?: number;
  height?: number;
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

const ProgressChart: React.FC<Props> = ({ issues, start, end }) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const getChartData = () => {
    const dateRangeArray = getDatesInRange(startDate, endDate);
    let count = 0;

    const dateWiseData = dateRangeArray.map((d) => {
      const current = d.toISOString().split("T")[0];
      const total = issues.length;
      const currentData = issues.filter(
        (i) => i.completed_at && i.completed_at.toString().split("T")[0] === current
      );
      count = currentData ? currentData.length + count : count;

      return {
        currentDate: renderShortNumericDateFormat(current),
        currentDateData: currentData,
        pending: new Date(current) < new Date() ? total - count : null,
      };
    });
    return dateWiseData;
  };

  const chartData = getChartData();

  return (
    <div className="w-full flex justify-center items-center">
      <LineGraph
        animate
        curve="monotoneX"
        height="160px"
        width="360px"
        enableGridY={false}
        lineWidth={1}
        margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
        data={[
          {
            id: "pending",
            color: "#3F76FF",
            data: chartData.map((item, index) => ({
              index,
              x: item.currentDate,
              y: item.pending,
              color: "#3F76FF",
            })),
            enableArea: true,
          },
          {
            id: "ideal",
            color: "#a9bbd0",
            fill: "transparent",
            data: [
              {
                x: chartData[0].currentDate,
                y: issues.length,
              },
              {
                x: chartData[chartData.length - 1].currentDate,
                y: 0,
              },
            ],
          },
        ]}
        layers={["grid", "markers", "areas", DashedLine, "slices", "points", "axes", "legends"]}
        axisBottom={{
          tickValues: chartData.map((item, index) => (index % 2 === 0 ? item.currentDate : "")),
        }}
        enablePoints={false}
        enableArea
        colors={(datum) => datum.color ?? "#3F76FF"}
        customYAxisTickValues={[0, issues.length]}
        gridXValues={chartData.map((item, index) => (index % 2 === 0 ? item.currentDate : ""))}
        theme={{
          background: "rgb(var(--color-bg-sidebar))",
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
