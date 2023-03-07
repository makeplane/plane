import {
  BacklogStateIcon,
  CancelledStateIcon,
  CompletedStateIcon,
  StartedStateIcon,
  UnstartedStateIcon,
} from "components/icons";

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
      return <UnstartedStateIcon width={width} height={height} color={color} />;
    case "started":
      return <StartedStateIcon width={width} height={height} color={color} />;
    case "completed":
      return <CompletedStateIcon width={width} height={height} color={color} />;
    case "cancelled":
      return <CancelledStateIcon width={width} height={height} color={color} />;
    default:
      return <></>;
  }
};
