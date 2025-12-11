/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

// Common classnames
const AXIS_TICK_CLASSNAME = "fill-tertiary text-13";

export const CustomXAxisTick = React.memo(function CustomXAxisTick({ x, y, payload, getLabel }: any) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text y={0} dy={16} textAnchor="middle" className={AXIS_TICK_CLASSNAME}>
        {getLabel ? getLabel(payload.value) : payload.value}
      </text>
    </g>
  );
});
CustomXAxisTick.displayName = "CustomXAxisTick";

export const CustomYAxisTick = React.memo(function CustomYAxisTick({ x, y, payload }: any) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text dx={-10} textAnchor="middle" className={AXIS_TICK_CLASSNAME}>
        {payload.value}
      </text>
    </g>
  );
});

CustomYAxisTick.displayName = "CustomYAxisTick";

export const CustomRadarAxisTick = React.memo(function CustomRadarAxisTick({
  x,
  y,
  payload,
  getLabel,
  cx,
  cy,
  offset = 16,
}: any) {
  // Calculate direction vector from center to tick
  const dx = x - cx;
  const dy = y - cy;
  // Normalize and apply offset
  const length = Math.sqrt(dx * dx + dy * dy);
  const normX = dx / length;
  const normY = dy / length;
  const labelX = x + normX * offset;
  const labelY = y + normY * offset;

  return (
    <g transform={`translate(${labelX},${labelY})`}>
      <text y={0} textAnchor="middle" className={AXIS_TICK_CLASSNAME}>
        {getLabel ? getLabel(payload.value) : payload.value}
      </text>
    </g>
  );
});
CustomRadarAxisTick.displayName = "CustomRadarAxisTick";
