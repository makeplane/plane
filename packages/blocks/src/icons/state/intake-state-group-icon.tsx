/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import type { IntakeStateGroup, StateIconSize } from "./helper";
import { getStateIconSize, INTAKE_STATE_GROUP_COLORS } from "./helper";
import { TriageGroupIcon } from "./triage-group-icon";

export type IntakeStateGroupIconProps = {
  className?: string;
  color?: string;
  stateGroup: IntakeStateGroup;
  size?: StateIconSize;
};

/** @deprecated Use IntakeStateGroupIconProps instead. */
export type IIntakeStateGroupIcon = IntakeStateGroupIconProps;

const iconComponents = { triage: TriageGroupIcon };

export function IntakeStateGroupIcon({ className = "", color, stateGroup, size = "sm" }: IntakeStateGroupIconProps) {
  const IntakeStateIconComponent = iconComponents[stateGroup] || TriageGroupIcon;
  const iconSize = getStateIconSize(size);

  return (
    <IntakeStateIconComponent
      height={iconSize}
      width={iconSize}
      color={color ?? INTAKE_STATE_GROUP_COLORS[stateGroup]}
      className={`flex-shrink-0 ${className}`}
    />
  );
}
