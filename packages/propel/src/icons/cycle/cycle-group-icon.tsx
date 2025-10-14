import * as React from "react";
import { CircleDotDashed, Circle } from "lucide-react";

import { CycleIcon } from "../cycle-icon";
import { CircleDotFullIcon } from "./circle-dot-full-icon";
import { CYCLE_GROUP_COLORS, ICycleGroupIcon } from "./helper";

const iconComponents = {
  current: CycleIcon,
  upcoming: CircleDotDashed,
  completed: CircleDotFullIcon,
  draft: Circle,
};

export const CycleGroupIcon: React.FC<ICycleGroupIcon> = ({
  className = "",
  color,
  cycleGroup,
  height = "12px",
  width = "12px",
}) => {
  const CycleIconComponent = iconComponents[cycleGroup] || CycleIcon;

  return (
    <CycleIconComponent
      height={height}
      width={width}
      color={color ?? CYCLE_GROUP_COLORS[cycleGroup]}
      className={`flex-shrink-0 ${className}`}
    />
  );
};
