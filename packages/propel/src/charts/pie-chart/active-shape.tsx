import React from "react";
import { Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

export const CustomActiveShape = React.memo(function CustomActiveShape(props: PieSectorDataItem) {
  const { cx, cy, cornerRadius, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        cornerRadius={cornerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        cornerRadius={cornerRadius}
        innerRadius={(outerRadius ?? 0) + 6}
        outerRadius={(outerRadius ?? 0) + 10}
        fill={fill}
      />
    </g>
  );
});
