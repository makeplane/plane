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

import { mutate } from "swr";
import {
  PROJECT_ALL_CYCLES,
  PROJECT_ESTIMATES,
  PROJECT_STATES,
  PROJECT_MEMBERS,
  PROJECT_LABELS,
  PROJECT_VIEWS,
  PROJECT_WORKFLOWS,
  PROJECT_MODULES,
  WORK_ITEM_TYPES_PROPERTIES_AND_OPTIONS,
  EPICS_PROPERTIES_AND_OPTIONS,
  WORKSPACE_PARTIAL_PROJECTS,
  WORKSPACE_PROJECTS_ROLES_INFORMATION,
} from "@/constants/fetch-keys";
import type { EUserPermissions } from "@plane/types";

export const revalidateProjectData = (
  workspaceSlug: string,
  entities: string[],
  projectId?: string,
  currentProjectRole?: EUserPermissions
) => {
  const entitySet = new Set(entities);
  if (entitySet.has("project")) {
    mutate(WORKSPACE_PROJECTS_ROLES_INFORMATION(workspaceSlug));
    mutate(WORKSPACE_PARTIAL_PROJECTS(workspaceSlug));
  }
  if (!projectId) return;
  if (entitySet.has("module")) {
    mutate(PROJECT_MODULES(projectId, currentProjectRole));
  }
  if (entitySet.has("cycle")) {
    mutate(PROJECT_ALL_CYCLES(projectId, currentProjectRole));
  }
  if (entitySet.has("estimate")) {
    mutate(PROJECT_ESTIMATES(projectId, currentProjectRole));
  }
  if (entitySet.has("view")) {
    mutate(PROJECT_VIEWS(projectId, currentProjectRole));
  }
  if (entitySet.has("workflow")) {
    mutate(PROJECT_WORKFLOWS(projectId, currentProjectRole));
  }
  if (entitySet.has("label")) {
    mutate(PROJECT_LABELS(projectId, currentProjectRole));
  }
  if (entitySet.has("member")) {
    mutate(PROJECT_MEMBERS(projectId, currentProjectRole));
  }
  if (entitySet.has("state")) {
    mutate(PROJECT_STATES(projectId, currentProjectRole));
  }
  if (entitySet.has("workitem") || entitySet.has("epic")) {
    mutate(WORK_ITEM_TYPES_PROPERTIES_AND_OPTIONS(projectId, currentProjectRole));
    mutate(EPICS_PROPERTIES_AND_OPTIONS(projectId, currentProjectRole));
  }
};
