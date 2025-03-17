/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

// Common classnames
const AXIS_TICK_CLASSNAME = "fill-custom-text-400 text-sm capitalize";

export const CustomXAxisTick = React.memo<any>(({ x, y, payload }: any) => (
  <g transform={`translate(${x},${y})`}>
    <text y={0} dy={16} textAnchor="middle" className={AXIS_TICK_CLASSNAME}>
      {payload.value}
    </text>
  </g>
));
CustomXAxisTick.displayName = "CustomXAxisTick";

export const CustomYAxisTick = React.memo<any>(({ x, y, payload }: any) => (
  <g transform={`translate(${x},${y})`}>
    <text dx={-10} textAnchor="middle" className={AXIS_TICK_CLASSNAME}>
      {payload.value}
    </text>
  </g>
));
CustomYAxisTick.displayName = "CustomYAxisTick";
