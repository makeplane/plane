import {
  BacklogStateIcon,
  CancelledStateIcon,
  CompletedStateIcon,
  StartedStateIcon,
  UnstartedStateIcon,
} from "components/icons";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

export const getStateGroupIcon = (
  stateGroup: "backlog" | "unstarted" | "started" | "completed" | "cancelled",
  width = "20",
  height = "20",
  color?: string
) => {
  switch (stateGroup) {
    case "backlog":
      return (
        <BacklogStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["backlog"]}
          className="flex-shrink-0"
        />
      );
    case "unstarted":
      return (
        <UnstartedStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["unstarted"]}
          className="flex-shrink-0"
        />
      );
    case "started":
      return (
        <StartedStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["started"]}
          className="flex-shrink-0"
        />
      );
    case "completed":
      return (
        <CompletedStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["completed"]}
          className="flex-shrink-0"
        />
      );
    case "cancelled":
      return (
        <CancelledStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["cancelled"]}
          className="flex-shrink-0"
        />
      );
    default:
      return <></>;
  }
};
