import React from "react";

// recharts
import { XAxis, YAxis, Tooltip, AreaChart, Area, ReferenceLine, TooltipProps } from "recharts";
// helper
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
//types
import { TCompletionChartDistribution } from "types";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

type Props = {
  distribution: TCompletionChartDistribution;
  startDate: string | Date;
  endDate: string | Date;
  totalIssues: number;
  width?: number;
  height?: number;
};

const ProgressChart: React.FC<Props> = ({
  distribution,
  startDate,
  endDate,
  totalIssues,
  width = 360,
  height = 160,
}) => {
  const chartData = Object.keys(distribution).map((key) => ({
    currentDate: renderShortNumericDateFormat(key),
    pending: distribution[key],
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md bg-brand-surface-1 p-2 text-xs text-brand-base border border-brand-base outline-none">
          {payload[0].payload.pending}{" "}
          <span className="text-brand-secondary">pending issues till</span>{" "}
          {payload[0].payload.currentDate}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="absolute -left-4  flex h-full w-full  items-center justify-center text-xs">
      <AreaChart
        width={width}
        height={height}
        data={chartData}
        margin={{
          top: 12,
          right: 12,
          left: 0,
          bottom: 12,
        }}
      >
        <defs>
          <linearGradient id="linearBlue" x1="0" y1="0" x2="0" y2="1">
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
          fill="url(#linearBlue)"
          activeDot={{ r: 8 }}
        />
        <ReferenceLine
          stroke="#16a34a"
          strokeDasharray="3 3"
          segment={[
            { x: `${renderShortNumericDateFormat(endDate)}`, y: 0 },
            { x: `${renderShortNumericDateFormat(startDate)}`, y: totalIssues },
          ]}
        />
      </AreaChart>
    </div>
  );
};

export default ProgressChart;
