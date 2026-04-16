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

import { STATE_GROUPS } from "@plane/constants";
import type {
  EIssuePropertyType,
  IIssueLabel,
  IIssueProperty,
  IIssueType,
  IModule,
  IState,
  TProject,
  TProjectTemplateFormData,
} from "@plane/types";

export type TProjectBlueprintDetails = Pick<TProject, "id" | "identifier" | "name" | "logo_props" | "module_view">;

export type TProjectTemplateFormGettersHelpers = {
  getCustomPropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
  getLabelById: (labelId: string) => IIssueLabel | null;
  getModuleById: (moduleId: string) => Pick<IModule, "id" | "name"> | null;
  getProjectById: (projectId: string | undefined | null) => TProjectBlueprintDetails | undefined;
  getProjectDefaultStateId: (projectId: string) => string | undefined;
  getProjectDefaultWorkItemTypeId: (projectId: string) => string | undefined;
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
  getWorkItemTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>;
  isWorkItemTypeEntityEnabled: () => boolean;
  labelIds: string[];
  memberIds: string[];
  moduleIds: string[];
  projectId: string | undefined;
  stateIds: string[];
};

export const projectTemplateFormGettersHelpers = (
  project: Partial<TProjectTemplateFormData>
): TProjectTemplateFormGettersHelpers => ({
  /**
   * Get the custom property by id. Includes epic properties since the epic is
   * stored at project.epics rather than inside project.workitem_types.
   * @param customPropertyId - The custom property id
   * @returns The custom property
   */
  getCustomPropertyById: (customPropertyId: string) => {
    const allCustomProperties = [
      ...Object.values(project.workitem_types ?? {}).flatMap((workItemType) => workItemType.properties),
      ...(project.epics?.properties ?? []),
    ];
    return allCustomProperties.find((customProperty) => customProperty.id === customPropertyId);
  },

  /**
   * Get the label by id
   * @param labelId - The label id
   * @returns The label
   */
  getLabelById: (labelId: string) => project.labels?.find((label) => label.id === labelId) ?? null,

  /**
   * Get the module by id
   * @param moduleId - The module id
   * @returns The module
   */
  getModuleById: (moduleId: string) => {
    const mod = project.modules?.find((m) => m.id === moduleId);
    if (!mod) return null;
    return { id: mod.id, name: mod.name };
  },

  /**
   * Get the project by id
   * @returns The project
   */
  getProjectById: () => {
    if (!project.id || !project.logo_props) return undefined;
    const projectName = project.name?.trim() || "Unnamed Project";
    return {
      id: project.id,
      name: projectName,
      identifier: projectName.slice(0, 5).toUpperCase(),
      logo_props: project.logo_props,
      module_view: project.module_view ?? false,
    };
  },

  /**
   * Get the default work item type id
   * @returns The default work item type id
   */
  getProjectDefaultWorkItemTypeId: () =>
    Object.values(project.workitem_types ?? {}).find((workItemType) => workItemType.is_default)?.id,

  /**
   * Get the default state id
   * @returns The default state id
   */
  getProjectDefaultStateId: () => project.states?.find((state) => state.default)?.id,

  /**
   * Get the state by id
   * @param stateId - The state id
   * @returns The state
   */
  getStateById: (stateId: string | null | undefined) => project.states?.find((state) => state.id === stateId),

  /**
   * Get the work item type by id. Falls back to the project's epic, which is
   * stored under project.epics rather than inside project.workitem_types.
   * @param workItemTypeId - The work item type id
   * @returns The work item type
   */
  getWorkItemTypeById: (workItemTypeId: string) => {
    const workItemType = project.workitem_types?.[workItemTypeId];
    if (workItemType) return workItemType;
    if (project.epics?.id === workItemTypeId) return project.epics;
    return undefined;
  },

  /**
   * Get the work item types
   * @param projectId - The project id
   * @param activeOnly - Whether to get only active work item types
   * @returns The work item types
   */
  getWorkItemTypes: (projectId: string, activeOnly: boolean) =>
    Object.entries(project.workitem_types ?? {}).reduce(
      (acc, [workItemTypeId, workItemType]) => {
        if (activeOnly && !workItemType.is_active) return acc;
        acc[workItemTypeId] = workItemType;
        return acc;
      },
      {} as Record<string, IIssueType>
    ),

  /**
   * Check if the work item type entity is enabled
   * @returns Whether the work item type entity is enabled
   */
  isWorkItemTypeEntityEnabled: () => project.is_issue_type_enabled ?? false,

  /**
   * Get the label ids
   * @returns The label ids
   */
  labelIds: project.labels?.map((label) => label.id) ?? [],

  /**
   * Get the member ids
   * @returns The member ids
   */
  memberIds: project.members ?? [],

  /**
   * Get the module ids
   * @returns The module ids
   */
  moduleIds: project.modules?.map((m) => m.id) ?? [],

  /**
   * Get the project id
   * @returns The project id
   */
  projectId: project?.id ?? undefined,

  /**
   * Get the state ids ordered by group
   * @returns The state ids
   */
  stateIds: project.states
    ? Object.keys(STATE_GROUPS)
        .flatMap((group) => project.states?.filter((state) => state.group === group).map((state) => state.id))
        .filter((id): id is string => id !== undefined)
        .filter(Boolean)
    : [],
});
