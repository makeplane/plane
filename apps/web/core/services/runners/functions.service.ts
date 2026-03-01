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

// helpers
import { API_BASE_URL } from "@plane/constants";
// types
import type { ScriptFunction, ScriptFunctionFilters, ScriptFunctionFormData } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class FunctionsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * List all functions (system + workspace) for a workspace
   */
  async list(workspaceSlug: string, filters?: ScriptFunctionFilters): Promise<ScriptFunction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/runnerctl/functions/`, {
      params: filters,
    })
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieve a specific function by ID
   */
  async retrieve(workspaceSlug: string, functionId: string): Promise<ScriptFunction> {
    return this.get(`/api/workspaces/${workspaceSlug}/runnerctl/functions/${functionId}/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new workspace function
   */
  async create(workspaceSlug: string, data: ScriptFunctionFormData): Promise<ScriptFunction> {
    return this.post(`/api/workspaces/${workspaceSlug}/runnerctl/functions/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a workspace function
   */
  async update(
    workspaceSlug: string,
    functionId: string,
    data: Partial<ScriptFunctionFormData>
  ): Promise<ScriptFunction> {
    return this.patch(`/api/workspaces/${workspaceSlug}/runnerctl/functions/${functionId}/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a workspace function (system functions cannot be deleted)
   */
  async destroy(workspaceSlug: string, functionId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/runnerctl/functions/${functionId}/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const functionsService = new FunctionsService();
