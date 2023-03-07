import React from "react";

import { XAxis, YAxis, Tooltip, AreaChart, Area, ReferenceLine, TooltipProps} from "recharts";

//types
import { IIssue } from "types";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
// helper
import { getDatesInRange, renderShortNumericDateFormat } from "helpers/date-time.helper";

type Props = {
  issues: IIssue[];
  start: string;
  end: string;
};

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
      console.log(payload[0].payload.currentDate);
      return (
        <div className="rounded-sm bg-gray-300 p-1 text-xs text-gray-800">
          <p>{payload[0].payload.currentDate}</p>
        </div>
      );
    }
    return null;
  };
  const ChartData = getChartData();
  return (
    <div className="absolute -left-12  flex h-full w-full  items-center justify-center   text-xs">
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
        <XAxis
          dataKey="currentDate"
          stroke="#9ca3af"
          tick={{ fontSize: "12px", fill: "#1f2937" }}
          tickSize={10}
          minTickGap={10}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fontSize: "12px", fill: "#1f2937" }}
          tickSize={10}
          minTickGap={10}
        />
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
};

export default ProgressChart;
