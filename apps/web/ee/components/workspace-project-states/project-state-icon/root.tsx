"use client";

import { FC } from "react";
// plane web constants
import { WORKSPACE_PROJECT_STATE_GROUPS } from "@/plane-web/constants/workspace-project-states";
// plane web types
import { EProjectStateGroup, TProjectStateGroupKey } from "@/plane-web/types/workspace-project-states";
// components
import { CancelledIcon } from "./cancelled";
import { CompletedIcon } from "./completed";
import { DraftIcon } from "./draft";
import { ExecutionIcon } from "./execution";
import { MonitoringIcon } from "./monitoring";
import { PlanningIcon } from "./planning";
// types
import { TProjectStateIcon } from "./types";

const projectStateIconComponents = {
  [EProjectStateGroup.DRAFT]: DraftIcon,
  [EProjectStateGroup.PLANNING]: PlanningIcon,
  [EProjectStateGroup.EXECUTION]: ExecutionIcon,
  [EProjectStateGroup.MONITORING]: MonitoringIcon,
  [EProjectStateGroup.COMPLETED]: CompletedIcon,
  [EProjectStateGroup.CANCELLED]: CancelledIcon,
};

type TProjectStateIconProps = TProjectStateIcon & { projectStateGroup?: TProjectStateGroupKey };

export const ProjectStateIcon: FC<TProjectStateIconProps> = (props) => {
  const {
    projectStateGroup = EProjectStateGroup.DRAFT,
    width = "20",
    height = "20",
    color,
    className = "text-current",
  } = props;

  // derived values
  const ProjectStateIconComponent = projectStateIconComponents[projectStateGroup];
  const currentStateColor = color ?? WORKSPACE_PROJECT_STATE_GROUPS[projectStateGroup]?.color;

  return (
    <ProjectStateIconComponent
      height={height}
      width={width}
      color={currentStateColor}
      className={`flex-shrink-0 ${className}`}
    />
  );
};
