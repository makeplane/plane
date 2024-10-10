"use client";

import { format, startOfToday } from "date-fns";
import { observer } from "mobx-react";
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
import { ICycle } from "@plane/types";
import { TProgressChartData } from "@/helpers/cycle.helper";
import { chartHelper, maxScope } from "./helper";
import { renderScopeLabel } from "./labels";
import { CustomizedXAxisTicks, CustomizedYAxisTicks } from "./ticks";
import CustomTooltip from "./tooltip";

type Props = {
  areaToHighlight?: string;
  cycle: ICycle;
  data?: TProgressChartData;
  isFullWidth?: boolean;
  estimateType?: string;
  plotType: string;
};

export const ActiveCycleChart = observer((props: Props) => {
  const { areaToHighlight, data = [], cycle, isFullWidth = false, plotType, estimateType = "ISSUES" } = props;
  let endDate: Date | string = new Date(cycle.end_date!);
  const today = format(startOfToday(), "yyyy-MM-dd");

  const { diffGradient, dataWithRange } = chartHelper(data, endDate, plotType);
  endDate = endDate.toISOString().split("T")[0];

  return (
    <ResponsiveContainer height="100%" width="100%">
      <ComposedChart
        data={dataWithRange}
        margin={{
          top: isFullWidth ? 20 : 30,
          right: isFullWidth ? 10 : 0,
          bottom: isFullWidth ? 20 : 70,
          left: isFullWidth ? -30 : 20,
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
        <Tooltip isAnimationActive={false} content={<CustomTooltip active payload={[]} label={""} plotType={plotType} />} />
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
          tickLine
          allowDecimals={false}
          strokeWidth={1}
          stroke="#C2C8D6"
          style={{ fontSize: "10px" }}
          domain={["dataMin", "dataMax"]}
          tick={<CustomizedYAxisTicks />}
        >
          <Label
            angle={270}
            style={{
              textAnchor: "start",
              fontSize: "12px",
              translate: "15px 0",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
            position="insideBottomLeft"
            value={estimateType}
          />
        </YAxis>
        {/* Line charts */}
        {/* Time left */}
        <Area dataKey="timeLeft" stroke="#EBF1FF" strokeWidth={0} fill={`url(#fillTimeLeft)`} />
        <Area dataKey="timeLeft" stroke="#EBF1FF" strokeWidth={0} fill="#E0EAFF" fillOpacity={0.5} />

        {/* Beyond Time */}
        <Area dataKey="beyondTime" stroke="#FF9999" strokeWidth={0} fill={`url(#fillTimeBeyond)`} />
        <ReferenceArea
          x1={endDate}
          x2={dataWithRange[dataWithRange.length - 1]?.date}
          y2={Math.max(maxScope(data), 2)}
          stroke="#EBF1FF"
          fill="#FFE5E5"
        >
          {!isFullWidth && (
            <Label
              fontSize={14}
              className="font-medium"
              angle={270}
              value={"Beyond Time"}
              fill="#FF9999"
              position="middle"
            />
          )}
        </ReferenceArea>

        {/* Today */}
        {today < endDate && <ReferenceLine x={today as string} stroke="black" label="" strokeDasharray="3 3" />}
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
          type="stepAfter"
          dataKey="scope"
          strokeWidth={2}
          stroke="rgba(var(--color-primary-100))"
          dot={false}
          animationEasing="ease-in"
          isAnimationActive={false}
        >
          {areaToHighlight === "scope" && (
            <LabelList offset={0} dataKey="scope" content={(e) => renderScopeLabel(data, e)} position={"left"} />
          )}
        </Line>
        {areaToHighlight === "scope" && (
          <Area
            type="stepAfter"
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
});
export default ActiveCycleChart;
