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

import type { FC } from "react";
// plane web constants
import { WORKSPACE_PROJECT_STATE_GROUPS } from "@/constants/workspace-project-states";
// plane web types
import type { TProjectStateGroupKey } from "@/types/workspace-project-states";
import { EProjectStateGroup } from "@/types/workspace-project-states";
// components
import { CancelledIcon } from "./cancelled";
import { CompletedIcon } from "./completed";
import { DraftIcon } from "./draft";
import { ExecutionIcon } from "./execution";
import { MonitoringIcon } from "./monitoring";
import { PlanningIcon } from "./planning";
// types
import type { TProjectStateIcon } from "./types";

const projectStateIconComponents = {
  [EProjectStateGroup.DRAFT]: DraftIcon,
  [EProjectStateGroup.PLANNING]: PlanningIcon,
  [EProjectStateGroup.EXECUTION]: ExecutionIcon,
  [EProjectStateGroup.MONITORING]: MonitoringIcon,
  [EProjectStateGroup.COMPLETED]: CompletedIcon,
  [EProjectStateGroup.CANCELLED]: CancelledIcon,
};

type TProjectStateIconProps = TProjectStateIcon & { projectStateGroup?: TProjectStateGroupKey };

export function ProjectStateIcon(props: TProjectStateIconProps) {
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
}
