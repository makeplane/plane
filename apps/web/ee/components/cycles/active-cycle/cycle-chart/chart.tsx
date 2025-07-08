"use client";

import { format, startOfToday } from "date-fns";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
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
  LabelList,
} from "recharts";
// plane imports
import { ICycle, TProgressChartData } from "@plane/types";
// helpers
import { ESTIMATE_TYPE } from "@/plane-web/constants/cycle";
import { chartHelper, getColors } from "./helper";
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
  showToday?: boolean;
  showAllTicks?: boolean;
};

export const ActiveCycleChart = observer((props: Props) => {
  const {
    areaToHighlight,
    data = [],
    cycle,
    isFullWidth = false,
    plotType,
    estimateType = "ISSUES",
    showToday,
    showAllTicks = false,
  } = props;

  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);

  // derived values
  let endDate: Date | string = new Date(cycle.end_date!);
  let startDate: Date | string = new Date(cycle.start_date!);
  const today = format(startOfToday(), "yyyy-MM-dd");
  const { diffGradient, dataWithRange } = chartHelper(data, endDate, plotType, colors);
  const cycleId = cycle.id;
  endDate = endDate.toISOString().split("T")[0];
  startDate = startDate.toISOString().split("T")[0];

  return (
    // Recharts 100% width doesn't work well with the sidebar https://github.com/recharts/recharts/issues/1423
    <ResponsiveContainer height="100%" width="99%">
      <ComposedChart
        data={dataWithRange}
        margin={{
          top: isFullWidth ? 10 : 30,
          right: isFullWidth ? 10 : 0,
          bottom: isFullWidth ? 30 : 70,
          left: isFullWidth ? -30 : 20,
        }}
      >
        <CartesianGrid stroke={colors.cartesianLines} vertical={false} />
        {/* Area fills */}
        <defs>
          {/* Time left */}
          <pattern
            id={`fillTimeLeft-${cycleId}`}
            patternUnits="userSpaceOnUse"
            width="4"
            height="8"
            patternTransform="rotate(-45 2 2)"
          >
            <path d="M -1,2 l 6,0" stroke={colors.timeLeftStroke} stroke-width=".5" />
          </pattern>

          {/* Beyond Time */}
          <pattern
            id={`fillTimeBeyond-${cycleId}`}
            patternUnits="userSpaceOnUse"
            width="4"
            height="8"
            patternTransform="rotate(-45 2 2)"
          >
            <path d="M -1,2 l 6,0" stroke={colors.beyondTimeStroke} stroke-width=".5" />
          </pattern>

          {/* actual */}
          <linearGradient id={`fillPending-${cycleId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#26D950" stopOpacity={1} />
            <stop offset="95%" stopColor="#26D950" stopOpacity={0.05} />
          </linearGradient>

          {/* Started */}
          <linearGradient id={`fillStarted-${cycleId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.startedArea} stopOpacity={1} />
            <stop offset="95%" stopColor={colors.startedArea} stopOpacity={0.05} />
          </linearGradient>

          {/* Scope */}
          <linearGradient id={`fillScope-${cycleId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.scopeArea} stopOpacity={1} />
            <stop offset="95%" stopColor={colors.scopeArea} stopOpacity={0.05} />
          </linearGradient>

          {/* Ideal */}
          <linearGradient id={`fillIdeal-${cycleId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.scopeArea} stopOpacity={0.9} />
            <stop offset="95%" stopColor={colors.scopeArea} stopOpacity={0.05} />
          </linearGradient>

          {/* Ideal - Actual */}
          <linearGradient id={`diff-${cycleId}`}>{diffGradient}</linearGradient>
        </defs>
        <Tooltip
          isAnimationActive={false}
          content={<CustomTooltip active payload={[]} label={""} plotType={plotType} endDate={endDate} />}
        />
        {/* Cartesian axis */}
        <XAxis
          dataKey="date"
          stroke={colors.axisLines}
          style={{ fontSize: "12px" }}
          tick={
            <CustomizedXAxisTicks
              data={data}
              endDate={endDate}
              stroke={colors.axisLines}
              text={colors.axisText}
              startDate={startDate}
              showToday={showToday}
              showAllTicks={showAllTicks}
            />
          }
          interval={0}
          tickFormatter={(date) => format(new Date(date), "MMM dd")}
          minTickGap={2}
          tickLine={false}
        />
        <YAxis
          tickCount={10}
          tickLine
          allowDecimals={false}
          strokeWidth={1}
          stroke={colors.axisLines}
          style={{ fontSize: "10px" }}
          domain={["dataMin", "dataMax"]}
          tick={<CustomizedYAxisTicks stroke={colors.axisLines} text={colors.axisText} />}
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
            value={`${ESTIMATE_TYPE[estimateType]}s`}
          />
        </YAxis>
        {/* Line charts */}
        {/* Time left */}
        <Area
          dataKey="timeLeft"
          stroke={colors.timeLeftStroke}
          strokeWidth={0}
          fill={`url(#fillTimeLeft-${cycleId})`}
        />
        <Area
          dataKey="timeLeft"
          stroke={colors.timeLeftStroke}
          strokeWidth={0}
          fill={colors.timeLeft}
          fillOpacity={0.5}
        />

        {/* Required when manual cycles are implemented */}
        {/* Beyond Time */}
        {/* <Area dataKey="beyondTime" stroke="#FF9999" strokeWidth={0} fill={`url(#fillTimeBeyond)`} />
        <ReferenceArea
          x1={endDate}
          x2={dataWithRange[dataWithRange.length - 1]?.date}
          y2={Math.max(maxScope(data), 2)}
          fill={colors.beyondTime}
        >
          {!isFullWidth && (
            <Label
              fontSize={14}
              className="font-medium"
              angle={270}
              value={"Beyond time"}
              fill={colors.beyondTimeStroke}
              position="middle"
            />
          )}
        </ReferenceArea> */}

        {/* Today */}
        {today < endDate && <ReferenceLine x={today as string} stroke={colors.todayLine} strokeDasharray="3 3" />}
        {/* Beyond Time */}
        <ReferenceLine x={endDate} stroke={colors.beyondTimeStroke} label="" strokeDasharray="3 3" />
        {/* Ideal - Actual */}
        <Area
          dataKey="range"
          strokeWidth={0}
          fill={`url(#diff-${cycleId})`}
          isAnimationActive={false}
          type="monotone"
        />

        {/* Ideal */}
        <Line
          type="monotone"
          dataKey="ideal"
          strokeWidth={1}
          stroke={colors.idealStroke}
          dot={false}
          strokeDasharray="5 5"
          isAnimationActive={false}
        />
        {areaToHighlight === "ideal" && (
          <Area
            type="monotone"
            dataKey="ideal"
            fill={`url(#fillIdeal-${cycleId})`}
            fillOpacity={0.4}
            stroke={colors.idealStroke}
            strokeWidth={0}
            isAnimationActive={false}
          />
        )}
        {/* Started */}
        <Line
          type="monotone"
          dataKey="started"
          strokeWidth={2}
          stroke={colors.startedStroke}
          dot={false}
          isAnimationActive={false}
        />
        {areaToHighlight === "started" && (
          <Area
            type="monotone"
            dataKey="started"
            fill={`url(#fillStarted-${cycleId})`}
            fillOpacity={0.4}
            stroke={colors.startedStroke}
            strokeWidth={1}
            isAnimationActive={false}
          />
        )}
        {/* Actual */}
        <Line
          type="monotone"
          dataKey="actual"
          strokeWidth={3}
          stroke={colors.actual}
          dot={false}
          isAnimationActive={false}
        />
        {areaToHighlight === "actual" && (
          <Area
            type="monotone"
            dataKey="actual"
            fill={`url(#fillPending-${cycleId})`}
            fillOpacity={0.4}
            stroke={colors.actual}
            strokeWidth={4}
            isAnimationActive={false}
          />
        )}

        {/* Scope */}
        <Line
          type="stepAfter"
          dataKey="scope"
          strokeWidth={2}
          stroke={colors.scopeStroke}
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
            fill={`url(#fillScope-${cycleId})`}
            fillOpacity={0.4}
            stroke={colors.scopeStroke}
            strokeWidth={0}
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
});
export default ActiveCycleChart;
