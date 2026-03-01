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
import type { RunnerScript, TRunnerScriptFilters, TRunnerScriptExecution, TRunnerScriptStats } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class RunnerCtlService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // Script endpoints
  async list(workspaceSlug: string, filters?: TRunnerScriptFilters): Promise<RunnerScript[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/runnerctl/scripts/`, {
      params: filters,
    })
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, scriptId: string): Promise<RunnerScript> {
    return this.get(`/api/workspaces/${workspaceSlug}/runnerctl/scripts/${scriptId}/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<RunnerScript>): Promise<RunnerScript> {
    return this.post(`/api/workspaces/${workspaceSlug}/runnerctl/scripts/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, scriptId: string, data: Partial<RunnerScript>): Promise<RunnerScript> {
    return this.patch(`/api/workspaces/${workspaceSlug}/runnerctl/scripts/${scriptId}/`, data)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, scriptId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/runnerctl/scripts/${scriptId}/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async testScript(
    workspaceSlug: string,
    formConfig: Partial<RunnerScript>,
    inputData?: unknown,
    executionVariables?: Record<string, string>
  ): Promise<TRunnerScriptExecution> {
    return this.post(`/api/workspaces/${workspaceSlug}/runnerctl/test/`, {
      ...formConfig,
      input_data: inputData,
      execution_variables: executionVariables,
    })
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Stats endpoint
  async listStats(workspaceSlug: string): Promise<TRunnerScriptStats> {
    return this.get(`/api/workspaces/${workspaceSlug}/runnerctl/stats/`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const runnerCtlService = new RunnerCtlService();
