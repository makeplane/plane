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
        />
      );
    case "unstarted":
      return (
        <UnstartedStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["unstarted"]}
        />
      );
    case "started":
      return (
        <StartedStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["started"]}
        />
      );
    case "completed":
      return (
        <CompletedStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["completed"]}
        />
      );
    case "cancelled":
      return (
        <CancelledStateIcon
          width={width}
          height={height}
          color={color ?? STATE_GROUP_COLORS["cancelled"]}
        />
      );
    default:
      return <></>;
  }
};
