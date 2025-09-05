import * as React from "react";

import { ISvgIcons } from "../type";
import { DashedCircle } from "./dashed-circle";

export const BacklogGroupIcon: React.FC<ISvgIcons> = ({
  width = "20",
  height = "20",
  className,
  color = "#60646C",
}) => {
  // SVG parameters
  const viewBoxSize = 16;
  const center = viewBoxSize / 2;
  const radius = 6;
  return (
    <svg
      height={height}
      width={width}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <DashedCircle center={center} radius={radius} color={color} percentage={0} />
    </svg>
  );
};
