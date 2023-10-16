import React from "react";

import { BacklogGroupIcon } from "./backlog-group-icon";
import { CancelledGroupIcon } from "./cancelled-group-icon";
import { CompletedGroupIcon } from "./completed-group-icon";
import { StartedGroupIcon } from "./started-group-icon";
import { UnstartedGroupIcon } from "./unstarted-group-icon";
import { IStateGroupIcon, STATE_GROUP_COLORS } from "./helper";

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
}) => {
  const StateIconComponent = iconComponents[stateGroup] || UnstartedGroupIcon;

  return (
    <StateIconComponent
      width="12px"
      height="12px"
      color={color ?? STATE_GROUP_COLORS[stateGroup]}
      className={`flex-shrink-0 ${className}`}
    />
  );
};
