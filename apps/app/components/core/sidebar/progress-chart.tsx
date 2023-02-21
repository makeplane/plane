import React from "react";

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

//types
import { IIssue } from "types";
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
  const ChartData = getChartData();
  return (
    <div className="relative h-[200px] w-full ">
      <div className="flex  justify-start items-start gap-4  text-xs">
        <div className="flex justify-center items-center gap-1">
          <span className="h-2 w-2 bg-green-600 rounded-full" />
          <span>Ideal</span>
        </div>
        <div className="flex justify-center items-center gap-1">
          <span className="h-2 w-2 bg-[#8884d8] rounded-full" />
          <span>Current</span>
        </div>
      </div>
      <div className="flex items-center justify-center h-full w-full  absolute -left-8 py-3  text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            width={300}
            height={200}
            data={ChartData}
            margin={{
              top: 0,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <XAxis dataKey="currentDate" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="pending"
              stroke="#8884d8"
              fill="#98d1fb"
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
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
