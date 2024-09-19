"use client";

import {
  Area,
  Line,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Label,
  Tooltip,
  ReferenceArea,
  LabelList,
} from "recharts";

import { chartHelper, maxScope } from "./helper";
import CustomTooltip from "./tooltip";
import { CustomizedXAxisTicks, CustomizedYAxisTicks } from "./ticks";
import { renderScopeLabel, renderYAxisLabel } from "./labels";
import { getToday } from "@/helpers/date-time.helper";
import { ICycle } from "@plane/types";

type Props = {
  areaToHighlight: string;
  cycle: ICycle;
  data: any;
};

export const ActiveCycleChart = (props: Props) => {
  const { areaToHighlight, data, cycle } = props;
  let endDate: Date | string = new Date(cycle.end_date!);

  const { diffGradient, dataWithRange } = chartHelper(data, endDate);
  endDate = endDate.toISOString().split("T")[0];

  return (
    <ResponsiveContainer width="100%">
      <ComposedChart
        data={dataWithRange}
        margin={{
          top: 30,
          right: 0,
          bottom: 70,
          left: 20,
        }}
      >
        <CartesianGrid stroke="#f5f5f5" vertical={false} />
        {/* Area fills */}
        <defs>
          {/* Time left */}
          <pattern
            id="fillTimeLeft"
            patternUnits="userSpaceOnUse"
            width="4"
            height="8"
            patternTransform="rotate(-45 2 2)"
          >
            <path d="M -1,2 l 6,0" stroke="#E0EAFF" stroke-width=".5" />
          </pattern>

          {/* Beyond Time */}
          <pattern
            id="fillTimeBeyond"
            patternUnits="userSpaceOnUse"
            width="4"
            height="8"
            patternTransform="rotate(-45 2 2)"
          >
            <path d="M -1,2 l 6,0" stroke="#FF9999" stroke-width=".5" />
          </pattern>

          {/* actual */}
          <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#26D950" stopOpacity={1} />
            <stop offset="95%" stopColor="#26D950" stopOpacity={0.05} />
          </linearGradient>

          {/* Started */}
          <linearGradient id="fillStarted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FFAA33" stopOpacity={1} />
            <stop offset="95%" stopColor="#FFAA33" stopOpacity={0.05} />
          </linearGradient>

          {/* Scope */}
          <linearGradient id="fillScope" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgba(var(--color-primary-100))" stopOpacity={1} />
            <stop offset="95%" stopColor="rgba(var(--color-primary-100))" stopOpacity={0.05} />
          </linearGradient>

          {/* Ideal */}
          <linearGradient id="fillIdeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgba(var(--color-primary-100))" stopOpacity={0.9} />
            <stop offset="95%" stopColor="rgba(var(--color-primary-100))" stopOpacity={0.05} />
          </linearGradient>

          {/* Ideal - Actual */}
          <linearGradient id="diff">{diffGradient}</linearGradient>
        </defs>
        <Tooltip content={<CustomTooltip />} />
        {/* Cartesian axis */}
        <XAxis
          dataKey="date"
          stroke="#C2C8D6"
          style={{ fontSize: "12px" }}
          tick={<CustomizedXAxisTicks data={data} endDate={endDate} />}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tickCount={10}
          tickLine={true}
          allowDecimals={false}
          strokeWidth={1}
          stroke="#C2C8D6"
          label={renderYAxisLabel}
          style={{ fontSize: "10px" }}
          domain={["dataMin", "dataMax + 2"]}
          tick={<CustomizedYAxisTicks />}
        >
          {/* <Label
            className="text-sm text-custom-text-400 tracking-widest"
            angle={270}
            x={0}
            value={"ISSUES"}
            position="insideBottomLeft"
            // content={(e) => renderYAxisLabel(data, e)}
          /> */}
          <Label angle={270} position="insideBottomLeft" content={renderYAxisLabel} />
        </YAxis>
        {/* Line charts */}
        {/* Time left */}
        <Area dataKey="timeLeft" stroke="#EBF1FF" strokeWidth={0} fill={`url(#fillTimeLeft)`} />
        <Area dataKey="timeLeft" stroke="#EBF1FF" strokeWidth={0} fill="#E0EAFF" fillOpacity={0.5} />

        {/* Beyond Time */}
        <Area dataKey="beyondTime" stroke="#FF9999" strokeWidth={0} fill={`url(#fillTimeBeyond)`} />
        <ReferenceArea
          x1={endDate}
          x2={dataWithRange[dataWithRange.length - 1].date}
          y2={maxScope(data)}
          stroke="#EBF1FF"
          fill="#FFE5E5"
        >
          <Label
            fontSize={14}
            className="font-medium"
            angle={270}
            value={"Beyond Time"}
            fill="#FF9999"
            position="middle"
          />
        </ReferenceArea>

        {/* Today */}
        <ReferenceLine x={getToday(true) as string} stroke="black" label="" strokeDasharray="3 3" />
        {/* Beyond Time */}
        <ReferenceLine x={endDate} stroke="#FF6666" label="" strokeDasharray="3 3" />
        {/* Started */}
        <Line type="linear" dataKey="started" strokeWidth={1} stroke="#FF9500" dot={false} />
        {areaToHighlight === "started" && (
          <Area
            dataKey="started"
            fill="url(#fillStarted)"
            fillOpacity={0.4}
            stroke="#FF9500"
            strokeWidth={1}
            isAnimationActive={false}
          />
        )}
        {/* Actual */}
        <Line type="linear" dataKey="actual" strokeWidth={3} stroke="#26D950" dot={false} isAnimationActive={false} />
        {areaToHighlight === "actual" && (
          <Area
            dataKey="actual"
            fill="url(#fillPending)"
            fillOpacity={0.4}
            stroke="#26D950"
            strokeWidth={4}
            isAnimationActive={false}
          />
        )}
        {/* Ideal */}
        <Line
          type="linear"
          dataKey="ideal"
          strokeWidth={1}
          stroke="#B8CEFF"
          dot={false}
          strokeDasharray="5 5"
          isAnimationActive={false}
        />
        {areaToHighlight === "ideal" && (
          <Area
            dataKey="ideal"
            fill="url(#fillIdeal)"
            fillOpacity={0.4}
            stroke="#B8CEFF"
            strokeWidth={0}
            isAnimationActive={false}
          />
        )}
        {/* Scope */}
        <Line
          type="step"
          dataKey="scope"
          strokeWidth={2}
          stroke="rgba(var(--color-primary-100))"
          dot={false}
          animationEasing="ease-in"
          isAnimationActive={false}
        >
          {areaToHighlight === "scope" && (
            <LabelList offset={10} dataKey="scope" content={(e) => renderScopeLabel(data, e)} position={"insideLeft"} />
          )}
        </Line>
        {areaToHighlight === "scope" && (
          <Area
            type="step"
            dataKey="scope"
            fill="url(#fillScope)"
            fillOpacity={0.4}
            stroke="rgba(var(--color-primary-100))"
            strokeWidth={0}
            isAnimationActive={false}
          />
        )}
        {/* Ideal - Actual */}
        <Area dataKey="range" stroke="#8884d8" strokeWidth={0} fill={`url(#diff)`} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
export default ActiveCycleChart;
