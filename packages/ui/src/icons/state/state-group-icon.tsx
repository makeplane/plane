import * as React from "react";

import { EIconSize } from "@plane/constants";
import { BacklogGroupIcon } from "./backlog-group-icon";
import { CancelledGroupIcon } from "./cancelled-group-icon";
import { CompletedGroupIcon } from "./completed-group-icon";
import { IStateGroupIcon, STATE_GROUP_COLORS, STATE_GROUP_SIZES } from "./helper";
import { StartedGroupIcon } from "./started-group-icon";
import { UnstartedGroupIcon } from "./unstarted-group-icon";

const iconComponents = {
  backlog: BacklogGroupIcon,
  cancelled: CancelledGroupIcon,
  completed: CompletedGroupIcon,
  started: StartedGroupIcon,
  unstarted: UnstartedGroupIcon,
};

export const StateGroupIcon: React.FC<IStateGroupIcon> = ({
  className = "",
  color,
  stateGroup,
  size = EIconSize.SM,
  percentage,
}) => {
  const StateIconComponent = iconComponents[stateGroup] || UnstartedGroupIcon;

  return (
    <StateIconComponent
      height={STATE_GROUP_SIZES[size]}
      width={STATE_GROUP_SIZES[size]}
      color={color ?? STATE_GROUP_COLORS[stateGroup]}
      className={`flex-shrink-0 ${className}`}
      percentage={percentage}
    />
  );
};
