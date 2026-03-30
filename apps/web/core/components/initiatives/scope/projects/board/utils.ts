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

import type { ReactNode } from "react";
// plane imports
import type { IBaseLayoutsBaseGroup, IUserLite } from "@plane/types";
import type { TInitiativeScopeProjectGroupBy } from "@plane/types";
// plane web imports
import { PROJECT_PRIORITIES } from "@/constants/project/default-root";
import { WORKSPACE_PROJECT_STATE_GROUPS } from "@/constants/workspace-project-states";
import type { TProject } from "@/types/projects";
import type { TProjectState, EProjectPriority } from "@/types/workspace-project-states";

export type TGroupedItemIds = Record<string, string[]>;

export interface IGroupingResult {
  groups: IBaseLayoutsBaseGroup[];
  groupedItemIds: TGroupedItemIds;
}

export interface IGroupDetailsHelpers {
  getProjectStateById?: (stateId: string) => TProjectState | undefined;
  getMemberById?: (memberId: string) => IUserLite | undefined;
  renderProjectStateIcon?: (stateId: string) => ReactNode;
  renderPriorityIcon?: (priority: string) => ReactNode;
  renderMemberAvatar?: (memberId: string) => ReactNode;
}

/**
 * Groups projects by a specified property
 */
export const groupProjectsByProperty = (
  projectIds: string[],
  getProjectById: (id: string) => TProject | undefined,
  groupBy: TInitiativeScopeProjectGroupBy,
  projectStateIds: string[],
  projectStateGroupIds: Record<string, string[]>,
  memberIds: string[],
  helpers: IGroupDetailsHelpers
): IGroupingResult => {
  const groupedItemIds: TGroupedItemIds = {};
  const groups: IBaseLayoutsBaseGroup[] = [];

  if (!groupBy || groupBy === "none") {
    // No grouping - single group with all items
    groups.push({ id: "all", name: "All Projects" });
    groupedItemIds["all"] = projectIds;
    return { groups, groupedItemIds };
  }

  switch (groupBy) {
    case "states": {
      // Initialize groups for each project state
      projectStateIds.forEach((stateId) => {
        const state = helpers.getProjectStateById?.(stateId);
        if (state && state.name) {
          groups.push({
            id: stateId,
            name: state.name,
            icon: helpers.renderProjectStateIcon?.(stateId),
            payload: { state_id: stateId },
          });
          groupedItemIds[stateId] = [];
        }
      });

      // Group projects by state
      projectIds.forEach((projectId) => {
        const project = getProjectById(projectId);
        if (project?.state_id && groupedItemIds[project.state_id]) {
          groupedItemIds[project.state_id].push(projectId);
        }
      });
      break;
    }

    case "state_groups": {
      // Initialize groups for each state group
      Object.entries(WORKSPACE_PROJECT_STATE_GROUPS).forEach(([groupKey, groupData]) => {
        if (projectStateGroupIds[groupKey]) {
          groups.push({
            id: groupKey,
            name: groupData.title,
          });
          groupedItemIds[groupKey] = [];
        }
      });

      // Group projects by state group
      projectIds.forEach((projectId) => {
        const project = getProjectById(projectId);
        if (project?.state_id) {
          // Find which state group this state belongs to
          for (const [groupKey, stateIds] of Object.entries(projectStateGroupIds)) {
            if (stateIds.includes(project.state_id)) {
              if (groupedItemIds[groupKey]) {
                groupedItemIds[groupKey].push(projectId);
              }
              break;
            }
          }
        }
      });
      break;
    }

    case "priority": {
      // Initialize groups for each priority
      PROJECT_PRIORITIES.forEach((priorityOption) => {
        groups.push({
          id: priorityOption.key,
          name: priorityOption.label,
          icon: helpers.renderPriorityIcon?.(priorityOption.key),
          payload: { priority: priorityOption.key },
        });
        groupedItemIds[priorityOption.key] = [];
      });

      // Group projects by priority
      projectIds.forEach((projectId) => {
        const project = getProjectById(projectId);
        const priority = project?.priority || "none";
        if (groupedItemIds[priority]) {
          groupedItemIds[priority].push(projectId);
        }
      });
      break;
    }

    case "lead": {
      // Initialize groups for each member + no lead
      memberIds.forEach((memberId) => {
        const member = helpers.getMemberById?.(memberId);
        if (member) {
          groups.push({
            id: memberId,
            name: member.display_name || member.email || "Unknown",
            icon: helpers.renderMemberAvatar?.(memberId),
            payload: { project_lead: memberId },
          });
          groupedItemIds[memberId] = [];
        }
      });

      // Add no lead group
      groups.push({
        id: "none",
        name: "No Lead",
        payload: { project_lead: null },
      });
      groupedItemIds["none"] = [];

      // Group projects by lead
      projectIds.forEach((projectId) => {
        const project = getProjectById(projectId);
        const leadId = typeof project?.project_lead === "string" ? project.project_lead : project?.project_lead?.id;

        if (!leadId) {
          groupedItemIds["none"].push(projectId);
        } else if (groupedItemIds[leadId]) {
          groupedItemIds[leadId].push(projectId);
        }
      });
      break;
    }
  }

  return { groups, groupedItemIds };
};

/**
 * Gets the update payload for a project based on groupBy and destination group
 */
export const getProjectUpdatePayload = (
  groupBy: TInitiativeScopeProjectGroupBy,
  destinationGroupId: string
): Partial<TProject> => {
  switch (groupBy) {
    case "states":
      return { state_id: destinationGroupId };
    case "priority":
      return { priority: destinationGroupId as EProjectPriority };
    case "lead":
      return { project_lead: destinationGroupId === "none" ? null : destinationGroupId };
    // state_groups is not directly updatable - need to pick a state from the group
    default:
      return {};
  }
};
