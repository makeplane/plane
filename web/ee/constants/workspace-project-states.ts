// plane web types
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
  };
} = {
  [EProjectStateGroup.DRAFT]: {
    title: "Draft",
    color: "#8B8D98",
  },
  [EProjectStateGroup.PLANNING]: {
    title: "Planning",
    color: "#80838D",
  },
  [EProjectStateGroup.EXECUTION]: {
    title: "Execution",
    color: "#FFBA18",
  },
  [EProjectStateGroup.MONITORING]: {
    title: "Monitoring",
    color: "#3E63DD",
  },
  [EProjectStateGroup.COMPLETED]: {
    title: "Completed",
    color: "#3E9B4F",
  },
  [EProjectStateGroup.CANCELLED]: {
    title: "Cancelled",
    color: "#DC3E42",
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
