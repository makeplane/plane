// icons
import {
  StateGroupBacklogIcon,
  StateGroupCancelledIcon,
  StateGroupCompletedIcon,
  StateGroupStartedIcon,
  StateGroupUnstartedIcon,
} from "components/icons";
// types
import { TStateGroups } from "@plane/types";
// constants
import { STATE_GROUPS } from "constants/state";

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
        color={color ?? STATE_GROUPS["backlog"].color}
        className={`flex-shrink-0 ${className}`}
      />
    );
  else if (stateGroup === "cancelled")
    return (
      <StateGroupCancelledIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUPS["cancelled"].color}
        className={`flex-shrink-0 ${className}`}
      />
    );
  else if (stateGroup === "completed")
    return (
      <StateGroupCompletedIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUPS["completed"].color}
        className={`flex-shrink-0 ${className}`}
      />
    );
  else if (stateGroup === "started")
    return (
      <StateGroupStartedIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUPS["started"].color}
        className={`flex-shrink-0 ${className}`}
      />
    );
  else
    return (
      <StateGroupUnstartedIcon
        width={width}
        height={height}
        color={color ?? STATE_GROUPS["unstarted"].color}
        className={`flex-shrink-0 ${className}`}
      />
    );
};
