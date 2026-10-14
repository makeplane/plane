/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import { BacklogGroupIcon } from "./backlog-group-icon";
import { CancelledGroupIcon } from "./cancelled-group-icon";
import { CompletedGroupIcon } from "./completed-group-icon";
import type { StateGroup, StateIconSize } from "./helper";
import { getStateIconSize, STATE_GROUP_COLORS } from "./helper";
import { StartedGroupIcon } from "./started-group-icon";
import { UnstartedGroupIcon } from "./unstarted-group-icon";

export type StateGroupIconProps = {
  className?: string;
  color?: string;
  percentage?: number;
  stateGroup: StateGroup;
  size?: StateIconSize;
};

/** @deprecated Use StateGroupIconProps instead. */
export type IStateGroupIcon = StateGroupIconProps;

const iconComponents = {
  backlog: BacklogGroupIcon,
  cancelled: CancelledGroupIcon,
  completed: CompletedGroupIcon,
  started: StartedGroupIcon,
  unstarted: UnstartedGroupIcon,
};

export function StateGroupIcon({ className = "", color, percentage, stateGroup, size = "sm" }: StateGroupIconProps) {
  const StateIconComponent = iconComponents[stateGroup] || UnstartedGroupIcon;
  const iconSize = getStateIconSize(size);

  return (
    <StateIconComponent
      height={iconSize}
      width={iconSize}
      color={color ?? STATE_GROUP_COLORS[stateGroup]}
      className={`shrink-0 ${className}`}
      percentage={percentage}
    />
  );
}
