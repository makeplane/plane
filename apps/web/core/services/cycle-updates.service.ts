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
// services
import type { TCycleConfig } from "@plane/types";
import type { CYCLE_ACTION } from "@/constants/cycle";
import { APIService } from "@/services/api.service";
import { CycleService as CycleServiceCore } from "@/services/cycle.service";
import type { TCycleUpdateReaction, TCycleUpdates } from "../types";

export class CycleUpdateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // EE Services

  async getCycleUpdates(workspaceSlug: string, projectId: string, cycleId: string): Promise<TCycleUpdates[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createCycleUpdate(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<TCycleUpdates>
  ): Promise<TCycleUpdates> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateCycleUpdate(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    updateId: string,
    data: Partial<TCycleUpdates>
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/${updateId}/`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteCycleUpdate(workspaceSlug: string, projectId: string, cycleId: string, updateId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/${updateId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // reactions
  async createCycleUpdateReaction(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    updateId: string,
    data: TCycleUpdateReaction
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/${updateId}/reactions`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteCycleUpdateReaction(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    updateId: string,
    reactionId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/updates/${updateId}/reactions/${reactionId}`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export class CycleService extends CycleServiceCore {
  async updateCycleStatus(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    date: string,
    action: CYCLE_ACTION
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/start-stop/`, {
      date,
      action,
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getCycleConfig(workspaceSlug: string, projectId: string): Promise<Partial<TCycleConfig>> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automated-cycles/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async scheduleCycle(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TCycleConfig>
  ): Promise<Partial<TCycleConfig>> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automated-cycles/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateCycleConfig(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TCycleConfig>
  ): Promise<Partial<TCycleConfig>> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automated-cycles/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export const cycleService = new CycleService();
