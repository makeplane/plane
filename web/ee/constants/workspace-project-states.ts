// plane web types
import { TIssuePriorities } from "@plane/constants";
import {
  EProjectStateGroup,
  TProjectState,
  TProjectStateDraggableData,
  TProjectStateGroupKey,
} from "@/plane-web/types/workspace-project-states";

export const WORKSPACE_PROJECT_STATE_GROUPS: {
  [key in TProjectStateGroupKey]: {
    title: string;
    color: string;
    background: string;
  };
} = {
  [EProjectStateGroup.DRAFT]: {
    title: "Draft",
    color: "#8B8D98",
    background: "#F3F4F7",
  },
  [EProjectStateGroup.PLANNING]: {
    title: "Planning",
    color: "#80838D",
    background: "#C7CBD2",
  },
  [EProjectStateGroup.EXECUTION]: {
    title: "Execution",
    color: "#FFBA18",
    background: "#FFF3D8",
  },
  [EProjectStateGroup.MONITORING]: {
    title: "Monitoring",
    color: "#3E63DD",
    background: "#D9E4FF",
  },
  [EProjectStateGroup.COMPLETED]: {
    title: "Completed",
    color: "#3E9B4F",
    background: "#D0EDDB",
  },
  [EProjectStateGroup.CANCELLED]: {
    title: "Cancelled",
    color: "#DC3E42",
    background: "#3A3A3A",
  },
};

export const WORKSPACE_PROJECT_STATE_PRIORITY: {
  [key in TIssuePriorities]: {
    title: string;
    colorClassName: string;
    background: string;
  };
} = {
  urgent: {
    title: "Urgent",
    colorClassName: "text-red-600",
    background: "#FAD7D5",
  },
  high: {
    title: "High",
    colorClassName: "text-orange-500",
    background: "#FEE4D5",
  },
  medium: {
    title: "Medium",
    colorClassName: "text-yellow-500",
    background: "#FBF0D5",
  },
  low: {
    title: "Low",
    colorClassName: "text-custom-primary-100",
    background: "#D9E3FF",
  },
  none: {
    title: "None",
    colorClassName: "text-custom-text-200",
    background: "#BBC5EB",
  },
};

export const getCurrentStateSequence = (
  groupSates: TProjectState[],
  destinationData: TProjectStateDraggableData,
  edge: string | undefined
) => {
  const defaultSequence = 65535;
  if (!edge) return defaultSequence;

  const destinationStateIndex = groupSates.findIndex((state) => state.id === destinationData.id);
  const destinationStateSequence = groupSates[destinationStateIndex]?.sequence || undefined;

  if (!destinationStateSequence) return defaultSequence;

  if (edge === "top") {
    const prevStateSequence = groupSates[destinationStateIndex - 1]?.sequence || undefined;

    if (prevStateSequence === undefined) {
      return destinationStateSequence - defaultSequence;
    }
    return (destinationStateSequence + prevStateSequence) / 2;
  } else if (edge === "bottom") {
    const nextStateSequence = groupSates[destinationStateIndex + 1]?.sequence || undefined;

    if (nextStateSequence === undefined) {
      return destinationStateSequence + defaultSequence;
    }
    return (destinationStateSequence + nextStateSequence) / 2;
  }
};
