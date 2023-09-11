// icons
import {
  StateGroupBacklogIcon,
  StateGroupCancelledIcon,
  StateGroupCompletedIcon,
  StateGroupStartedIcon,
  StateGroupUnstartedIcon,
} from "components/icons";
// types
import { TStateGroups } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

type Props = {
  className?: string;
  color?: string;
  height?: string;
  stateGroup: TStateGroups;
  width?: string;
};

export const StateGroupIcon: React.FC<Props> = ({
  className = "",
  color,
  height = "12px",
  width = "12px",
  stateGroup,
}) => {
  if (stateGroup === "backlog")
    return (
      <StateGroupBacklogIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUP_COLORS["backlog"]}
        className={`flex-shrink-0 ${className}`}
      />
    );
  else if (stateGroup === "cancelled")
    return (
      <StateGroupCancelledIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUP_COLORS["cancelled"]}
        className={`flex-shrink-0 ${className}`}
      />
    );
  else if (stateGroup === "completed")
    return (
      <StateGroupCompletedIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUP_COLORS["completed"]}
        className={`flex-shrink-0 ${className}`}
      />
    );
  else if (stateGroup === "started")
    return (
      <StateGroupStartedIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUP_COLORS["started"]}
        className={`flex-shrink-0 ${className}`}
      />
    );
  else
    return (
      <StateGroupUnstartedIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUP_COLORS["unstarted"]}
        className={`flex-shrink-0 ${className}`}
      />
    );
};
