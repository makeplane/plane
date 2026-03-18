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

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  TCreateProjectWorkItemTypePayload,
  TUpdateProjectWorkItemTypePayload,
  TDeleteProjectWorkItemTypePayload,
  TLinkPropertyToLocalTypePayload,
  TUnlinkPropertyFromLocalTypePayload,
  TImportWorkItemTypesPayload,
  TWorkItemTypeResponse,
  TReorderPropertyToLocalTypePayload,
} from "@plane/types";
// local imports
import { APIService } from "../api.service";

export class ProjectWorkItemTypesService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string, projectId: string): Promise<TWorkItemTypeResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-item-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(payload: TCreateProjectWorkItemTypePayload): Promise<TWorkItemTypeResponse> {
    // Project-level create/update/delete still lives on the legacy issue-types routes.
    return this.post(
      `/api/workspaces/${payload.workspaceSlug}/projects/${payload.projectId}/issue-types/`,
      payload.data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(payload: TUpdateProjectWorkItemTypePayload): Promise<void> {
    return this.patch(
      `/api/workspaces/${payload.workspaceSlug}/projects/${payload.projectId}/issue-types/${payload.typeId}/`,
      payload.data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(payload: TDeleteProjectWorkItemTypePayload): Promise<void> {
    return this.delete(
      `/api/workspaces/${payload.workspaceSlug}/projects/${payload.projectId}/issue-types/${payload.typeId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async linkProperty(_payload: TLinkPropertyToLocalTypePayload): Promise<Record<string, number>> {
    // TODO: Wire the project-scoped work-item-type/property link endpoint once the
    // backend route is available. Keeping the service surface intact for the store/UI migration.
    throw new Error("Project work item type property linking endpoint is not available yet.");
  }

  async reorderProperty(_payload: TReorderPropertyToLocalTypePayload): Promise<void> {
    // TODO: Wire the project-scoped work-item-type/property reordering endpoint once the
    // backend route is available. Keeping the service surface intact for the store/UI migration.
    throw new Error("Project work item type property reordering endpoint is not available yet.");
  }

  async unlinkProperty(_payload: TUnlinkPropertyFromLocalTypePayload): Promise<void> {
    // TODO: Wire the project-scoped work-item-type/property unlink endpoint once the
    // backend route is available. Keeping the service surface intact for the store/UI migration.
    throw new Error("Project work item type property unlinking endpoint is not available yet.");
  }

  async importGlobalTypes(payload: TImportWorkItemTypesPayload): Promise<void> {
    return this.post(`/api/workspaces/${payload.workspaceSlug}/projects/${payload.projectId}/import-work-item-types/`, {
      work_item_types: payload.typeIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeImportedTypes(_payload: TImportWorkItemTypesPayload): Promise<void> {
    // TODO: Wire the project-scoped imported work-item-type removal endpoint once the
    // backend route is available. Keeping the service surface intact for the store/UI migration.
    throw new Error("Project imported work item type removal endpoint is not available yet.");
  }
}
