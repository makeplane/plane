/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import { CycleIcon } from "../project/cycle-icon";
import { CircleDotFullIcon } from "./circle-dot-full-icon";
import type { CycleGroup } from "./helper";
import { CYCLE_GROUP_COLORS } from "./helper";
import { CycleUpcoming, CircleOutline } from "@makeplane/propel/icons";

export type CycleGroupIconProps = {
  className?: string;
  color?: string;
  cycleGroup: CycleGroup;
  height?: string;
  width?: string;
};

/** @deprecated Use CycleGroupIconProps instead. */
export type ICycleGroupIcon = CycleGroupIconProps;

const iconComponents = {
  current: CycleIcon,
  upcoming: CycleUpcoming,
  completed: CircleDotFullIcon,
  draft: CircleOutline,
};

export function CycleGroupIcon({
  className = "",
  color,
  cycleGroup,
  height = "12px",
  width = "12px",
}: CycleGroupIconProps) {
  const CycleIconComponent = iconComponents[cycleGroup] || CycleIcon;

  return (
    <CycleIconComponent
      height={height}
      width={width}
      color={color ?? CYCLE_GROUP_COLORS[cycleGroup]}
      className={`flex-shrink-0 ${className}`}
    />
  );
}
