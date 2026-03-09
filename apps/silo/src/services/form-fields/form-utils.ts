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

import type { PlaneClient, PriorityEnum } from "@makeplane/plane-node-sdk";
import { SILO_FORM_OPTIONS_CACHE_KEY } from "@/helpers/cache-keys";
import { getPlaneClientV2 } from "@/helpers/plane-api-client-v2";
import type { SelectOption } from "@/types/form/base";
import { Store } from "@/worker/base";

export interface ProjectConfig {
  id: string;
  name: string;
  isIntakeEnabled: boolean;
  isIssueTypeEnabled: boolean;
}

export enum OptionsEntity {
  LABEL = "labels",
  STATE = "state",
  PRIORITY = "priority",
  WORK_ITEM_TYPES = "workItemTypes",
  ASSIGNEE = "assignees",
}

export interface GetOptionsForEntityParams {
  slug: string;
  projectId: string;
  typeIdentifier: string;
  searchText?: string;
  sessionCacheKey?: string;
}

export class FormUtils {
  private planeAPIClient: PlaneClient;

  constructor(accessToken: string) {
    this.planeAPIClient = getPlaneClientV2({ accessToken });
  }

  async getProjectConfig(slug: string, projectId: string): Promise<ProjectConfig> {
    const project = await this.planeAPIClient.projects.retrieve(slug, projectId);
    if (!project?.id) {
      throw new Error("Project not found");
    }
    return {
      id: project.id,
      name: project.name,
      isIntakeEnabled: project.intake_view ?? false,
      isIssueTypeEnabled: project.is_issue_type_enabled ?? false,
    };
  }

  /**
   * Get options for an entity
   * @param slug - The slug of the workspace
   * @param projectId - The ID of the project
   * @param optionsEntity - The entity to get options for
   * @param propertyOptionsParams - The parameters for the property options. Only required for WORK_ITEM_PROPERTY.
   * @returns The options for the entity
   */
  async getOptionsForEntity({
    slug,
    projectId,
    typeIdentifier,
    searchText,
  }: GetOptionsForEntityParams): Promise<SelectOption[]> {
    let options: SelectOption[] = [];

    const cacheKey = SILO_FORM_OPTIONS_CACHE_KEY(slug, projectId, typeIdentifier);
    const store = Store.getInstance();
    const cachedOptionsResp = await store.get(cacheKey);
    if (cachedOptionsResp) {
      options = JSON.parse(cachedOptionsResp);
    } else {
      switch (typeIdentifier) {
        case OptionsEntity.LABEL:
          // oxlint-disable-next-line no-case-declarations
          const labels = await this.planeAPIClient.labels.list(slug, projectId);
          options = labels.results.map((label) => ({
            value: label.id ?? "",
            label: label.name ?? "",
          }));
          break;
        case OptionsEntity.STATE:
          // oxlint-disable-next-line no-case-declarations
          const states = await this.planeAPIClient.states.list(slug, projectId);
          options = states.results.map((state) => ({
            value: state.id ?? "",
            label: state.name ?? "",
          }));
          break;
        case OptionsEntity.PRIORITY:
          // oxlint-disable-next-line no-case-declarations
          const priorityValues: PriorityEnum[] = ["urgent", "high", "medium", "low", "none"];
          // oxlint-disable-next-line no-case-declarations
          const priorities = priorityValues.map((priority) => ({
            value: priority,
            label: priority.charAt(0).toUpperCase() + priority.slice(1),
          }));
          options = priorities;
          break;
        case OptionsEntity.WORK_ITEM_TYPES:
          // oxlint-disable-next-line no-case-declarations
          const workItemTypes = await this.planeAPIClient.workItemTypes.list(slug, projectId);
          options = workItemTypes.map((workItemType) => ({
            value: workItemType.id ?? "",
            label: workItemType.name ?? "",
          }));
          break;
        case OptionsEntity.ASSIGNEE:
          // oxlint-disable-next-line no-case-declarations
          const assignees = await this.planeAPIClient.projects.getMembers(slug, projectId);
          options = assignees.map((assignee) => ({
            value: assignee.id ?? "",
            label: assignee.display_name ?? "",
          }));
          break;
        default:
          // assuming this is for custom fields
          // oxlint-disable-next-line no-case-declarations
          const [issueTypeId, propertyId] = typeIdentifier.split(":");
          if (!issueTypeId || !propertyId) {
            throw new Error("Invalid type identifier");
          }
          // oxlint-disable-next-line no-case-declarations
          const workItemProperty = await this.planeAPIClient.workItemProperties.retrieve(
            slug,
            projectId,
            issueTypeId,
            propertyId
          );
          if (!["RELATION", "OPTION"].includes(workItemProperty.property_type)) {
            return [];
          }

          if (workItemProperty.property_type === "RELATION") {
            const assignees = await this.planeAPIClient.projects.getMembers(slug, projectId);
            options = assignees.map((assignee) => ({
              value: assignee.id ?? "",
              label: assignee.display_name ?? "",
            }));
          } else if (workItemProperty.property_type === "OPTION") {
            const propertyOptions = await this.planeAPIClient.workItemProperties.options.list(
              slug,
              projectId,
              propertyId
            );
            options = propertyOptions.map((option) => ({
              value: option.id ?? "",
              label: option.name ?? "",
            }));
          }
          break;
      }
      await store.set(cacheKey, JSON.stringify(options), 60 * 5); // 5 minutes
    }

    if (searchText) {
      options = options.filter((option) => option.label.toLowerCase().includes(searchText.toLowerCase()));
    }

    return options;
  }
}

export const getFormUtilsService = (accessToken: string): FormUtils => new FormUtils(accessToken);
