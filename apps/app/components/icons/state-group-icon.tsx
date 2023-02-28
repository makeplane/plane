import { BacklogStateIcon } from "./backlog-state-icon";
import { CompletedStateIcon } from "./completed-state-icon";
import { StartedStateIcon } from "./started-state-icon";

export const getStateGroupIcon = (
  stateGroup: "backlog" | "unstarted" | "started" | "completed" | "cancelled",
  width = "20",
  height = "20",
  color?: string
) => {
  switch (stateGroup) {
    case "backlog":
      return <BacklogStateIcon width={width} height={height} color={color} />;
    case "unstarted":
      return <StartedStateIcon width={width} height={height} color={color} />;
    case "started":
      return <StartedStateIcon width={width} height={height} color={color} />;
    case "completed":
      return <CompletedStateIcon width={width} height={height} color={color} />;
    case "cancelled":
      return <StartedStateIcon width={width} height={height} color={color} />;
    default:
      return <></>;
  }
};
