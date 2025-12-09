import * as React from "react";

import { EIconSize } from "@plane/constants";
import type { IIntakeStateGroupIcon } from "./helper";
import { INTAKE_STATE_GROUP_COLORS, STATE_GROUP_SIZES } from "./helper";
import { TriageGroupIcon } from "./triage-group-icon";

const iconComponents = { triage: TriageGroupIcon };

export function IntakeStateGroupIcon({
  className = "",
  color,
  stateGroup,
  size = EIconSize.SM,
}: IIntakeStateGroupIcon) {
  const IntakeStateIconComponent = iconComponents[stateGroup] || TriageGroupIcon;

  return (
    <IntakeStateIconComponent
      height={STATE_GROUP_SIZES[size]}
      width={STATE_GROUP_SIZES[size]}
      color={color ?? INTAKE_STATE_GROUP_COLORS[stateGroup]}
      className={`flex-shrink-0 ${className}`}
    />
  );
}
