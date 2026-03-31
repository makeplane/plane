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
  EAutomationNodeType,
  TAutomation,
  TAutomationActivity,
  TAutomationActivityFilters,
  TAutomationDetails,
  TAutomationNode,
  TAutomationNodeConfig,
  TAutomationNodeEdge,
  TAutomationNodeHandlerName,
} from "@plane/types";
// local imports
import { APIService } from "../api.service";

export class WorkspaceAutomationsService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<TAutomation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/automations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, automationId: string): Promise<TAutomationDetails> {
    return this.get(`/api/workspaces/${workspaceSlug}/automations/${automationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<TAutomation>): Promise<TAutomation> {
    return this.post(`/api/workspaces/${workspaceSlug}/automations/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, automationId: string, data: Partial<TAutomation>): Promise<TAutomation> {
    return this.patch(`/api/workspaces/${workspaceSlug}/automations/${automationId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateStatus(workspaceSlug: string, automationId: string, isEnabled: boolean): Promise<TAutomation> {
    return this.post(`/api/workspaces/${workspaceSlug}/automations/${automationId}/status/`, {
      is_enabled: isEnabled,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, automationId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/automations/${automationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createNode<T extends TAutomationNode>(
    workspaceSlug: string,
    automationId: string,
    data: Partial<T>
  ): Promise<T> {
    return this.post(`/api/workspaces/${workspaceSlug}/automations/${automationId}/nodes/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateNode<
    T extends EAutomationNodeType,
    H extends TAutomationNodeHandlerName,
    C extends TAutomationNodeConfig,
  >(
    workspaceSlug: string,
    automationId: string,
    nodeId: string,
    data: Partial<TAutomationNode<T, H, C>>
  ): Promise<TAutomationNode<T, H, C>> {
    return this.patch(`/api/workspaces/${workspaceSlug}/automations/${automationId}/nodes/${nodeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteNode(workspaceSlug: string, automationId: string, nodeId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/automations/${automationId}/nodes/${nodeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createEdge(
    workspaceSlug: string,
    automationId: string,
    sourceNodeId: string,
    targetNodeId: string
  ): Promise<TAutomationNodeEdge> {
    return this.post(`/api/workspaces/${workspaceSlug}/automations/${automationId}/edges/`, {
      source_node: sourceNodeId,
      target_node: targetNodeId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteEdge(workspaceSlug: string, automationId: string, edgeId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/automations/${automationId}/edges/${edgeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listActivities(
    workspaceSlug: string,
    automationId: string,
    filters: TAutomationActivityFilters
  ): Promise<TAutomationActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/automations/${automationId}/activities/`, {
      params: filters,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
