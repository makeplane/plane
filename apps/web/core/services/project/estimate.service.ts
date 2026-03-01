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

/* eslint-disable no-useless-catch */

// types
import { API_BASE_URL } from "@plane/constants";
import type { IEstimate, IEstimateFormData, IEstimatePoint } from "@plane/types";
import { APIService } from "@/services/api.service";

export class EstimateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchWorkspaceEstimates(workspaceSlug: string): Promise<IEstimate[] | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/estimates/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async fetchProjectEstimates(workspaceSlug: string, projectId: string): Promise<IEstimate[] | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async fetchEstimateById(
    workspaceSlug: string,
    projectId: string,
    estimateId: string
  ): Promise<IEstimate | undefined> {
    try {
      const { data } = await this.get(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async createEstimate(
    workspaceSlug: string,
    projectId: string,
    payload: IEstimateFormData
  ): Promise<IEstimate | undefined> {
    try {
      const { data } = await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/`, payload);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async deleteEstimate(workspaceSlug: string, projectId: string, estimateId: string): Promise<void> {
    try {
      await this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`);
    } catch (error) {
      throw error;
    }
  }

  async createEstimatePoint(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    payload: Partial<IEstimatePoint>
  ): Promise<IEstimatePoint | undefined> {
    try {
      const { data } = await this.post(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/estimate-points/`,
        payload
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async updateEstimatePoint(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    estimatePointId: string,
    payload: Partial<IEstimatePoint>
  ): Promise<IEstimatePoint | undefined> {
    try {
      const { data } = await this.patch(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/estimate-points/${estimatePointId}/`,
        payload
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async updateEstimate(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    payload: Partial<IEstimateFormData>
  ): Promise<IEstimate | undefined> {
    try {
      const { data } = await this.patch(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/`,
        payload
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  async removeEstimatePoint(
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    estimatePointId: string,
    params?: { new_estimate_id: string | undefined }
  ): Promise<IEstimatePoint[] | undefined> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/estimates/${estimateId}/estimate-points/${estimatePointId}/`,
      params
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const estimateService = new EstimateService();

export default estimateService;
