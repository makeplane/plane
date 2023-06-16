import React from "react";

import { XAxis, YAxis, Tooltip, AreaChart, Area, ReferenceLine, TooltipProps } from "recharts";

//types
import { IIssue } from "types";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
// helper
import { getDatesInRange, renderShortNumericDateFormat } from "helpers/date-time.helper";
// constants
import { CHARTS_THEME } from "constants/graph";
// ui
import { LineGraph } from "components/ui";

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

  const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-sm bg-brand-surface-1 p-1 text-xs text-brand-base">
          <p>{payload[0].payload.currentDate}</p>
        </div>
      );
    }
    return null;
  };
  const ChartData = getChartData();

  return (
    <div className="fixed h-screen top-0 left-0 w-full z-[9999909999] flex justify-center items-center bg-brand-surface-1">
      <LineGraph
        animate
        curve="monotoneX"
        height="160px"
        width="360px"
        // enableGridX={false}
        enableGridY={false}
        lineWidth={1}
        margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
        data={[
          {
            id: "pending",
            color: "#3F76FF",
            data: ChartData.map((item, index) => ({
              index,
              x: item.currentDate,
              y: item.pending,
              color: "#3F76FF",
            })),
            enableArea: true,
          },
          {
            id: "ideal",
            color: "#16a34a",
            fill: "transparent",
            data: [
              {
                x: ChartData[0].currentDate,
                y: issues.length,
              },
              {
                x: ChartData[ChartData.length - 1].currentDate,
                y: 0,
              },
            ],
          },
        ]}
        layers={["grid", "markers", "areas", DashedLine, "slices", "points", "axes", "legends"]}
        axisBottom={{
          tickValues: ChartData.map((item, index) => (index % 2 === 0 ? item.currentDate : "")),
        }}
        enablePoints={false}
        enableArea
        colors={(datum) => datum.color ?? "#3F76FF"}
        customYAxisTickValues={[0, issues.length]}
        gridXValues={ChartData.map((item, index) => (index % 2 === 0 ? item.currentDate : ""))}
        theme={{
          ...CHARTS_THEME,
          background: "transparent",
        }}
      />

      <AreaChart
        width={360}
        height={160}
        data={ChartData}
        margin={{
          top: 12,
          right: 12,
          left: 0,
          bottom: 12,
        }}
      >
        <defs>
          <linearGradient id="linearblue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3F76FF" stopOpacity={0.7} />
            <stop offset="50%" stopColor="#3F76FF" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#3F76FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="currentDate" tickSize={10} minTickGap={10} />
        <YAxis tickSize={10} minTickGap={10} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="pending"
          stroke="#8884d8"
          fill="url(#linearblue)"
          activeDot={{ r: 8 }}
        />
        <ReferenceLine
          stroke="#16a34a"
          strokeDasharray="3 3"
          segment={[
            { x: `${renderShortNumericDateFormat(endDate)}`, y: 0 },
            { x: `${renderShortNumericDateFormat(startDate)}`, y: issues.length },
          ]}
        />
      </AreaChart>
    </div>
  );

  // return (
  //   <div className="absolute -left-4  flex h-full w-full  items-center justify-center text-xs">
  //     <AreaChart
  //       width={width}
  //       height={height}
  //       data={ChartData}
  //       margin={{
  //         top: 12,
  //         right: 12,
  //         left: 0,
  //         bottom: 12,
  //       }}
  //     >
  //       <defs>
  //         <linearGradient id="linearblue" x1="0" y1="0" x2="0" y2="1">
  //           <stop offset="0%" stopColor="#3F76FF" stopOpacity={0.7} />
  //           <stop offset="50%" stopColor="#3F76FF" stopOpacity={0.1} />
  //           <stop offset="100%" stopColor="#3F76FF" stopOpacity={0} />
  //         </linearGradient>
  //       </defs>
  //       <XAxis dataKey="currentDate" tickSize={10} minTickGap={10} />
  //       <YAxis tickSize={10} minTickGap={10} allowDecimals={false} />
  //       <Tooltip content={<CustomTooltip />} />
  //       <Area
  //         type="monotone"
  //         dataKey="pending"
  //         stroke="#8884d8"
  //         fill="url(#linearblue)"
  //         activeDot={{ r: 8 }}
  //       />
  //       <ReferenceLine
  //         stroke="#16a34a"
  //         strokeDasharray="3 3"
  //         segment={[
  //           { x: `${renderShortNumericDateFormat(endDate)}`, y: 0 },
  //           { x: `${renderShortNumericDateFormat(startDate)}`, y: issues.length },
  //         ]}
  //       />
  //     </AreaChart>
  //   </div>
  // );
};

export default ProgressChart;
