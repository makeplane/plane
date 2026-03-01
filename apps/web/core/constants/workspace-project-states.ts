/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane web types
import type { TIssuePriorities } from "@plane/constants";
import type {
  TProjectState,
  TProjectStateDraggableData,
  TProjectStateGroupKey,
} from "@/types/workspace-project-states";
import { EProjectStateGroup } from "@/types/workspace-project-states";

export const WORKSPACE_PROJECT_STATE_GROUPS: {
  [key in TProjectStateGroupKey]: {
    title: string;
    color: string;
    background: string;
  };
} = {
  [EProjectStateGroup.DRAFT]: {
    title: "Draft",
    color: "#60646C",
    background: "#F3F4F7",
  },
  [EProjectStateGroup.PLANNING]: {
    title: "Planning",
    color: "#60646C",
    background: "#C7CBD2",
  },
  [EProjectStateGroup.EXECUTION]: {
    title: "Execution",
    color: "#F59E0B",
    background: "#FFF3D8",
  },
  [EProjectStateGroup.MONITORING]: {
    title: "Monitoring",
    color: "#00838F",
    background: "#D9E4FF",
  },
  [EProjectStateGroup.COMPLETED]: {
    title: "Completed",
    color: "#46A758",
    background: "#D0EDDB",
  },
  [EProjectStateGroup.CANCELLED]: {
    title: "Cancelled",
    color: "#9AA4BC",
    background: "#FAD7D5",
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
    colorClassName: "text-danger-primary",
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
    colorClassName: "text-accent-primary",
    background: "#D9E3FF",
  },
  none: {
    title: "None",
    colorClassName: "text-secondary",
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
