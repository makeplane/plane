/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  IWorkspaceSprint,
  IWorkspaceSprintAutomation,
  IWorkspaceSprintAutomationMember,
  TWorkspaceSprintAutomationPayload,
  TWorkspaceSprintCreatePayload,
  WorkspaceSprintIssueResponse,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class WorkspaceSprintService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(
    workspaceSlug: string,
    params?: { archived?: boolean; automation_id?: string }
  ): Promise<IWorkspaceSprint[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/sprints/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listArchived(workspaceSlug: string, automationId?: string): Promise<IWorkspaceSprint[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/archived-sprints/`, {
      params: automationId ? { automation_id: automationId } : undefined,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<TWorkspaceSprintCreatePayload>): Promise<IWorkspaceSprint> {
    return this.post(`/api/workspaces/${workspaceSlug}/sprints/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    sprintId: string,
    data: Partial<TWorkspaceSprintCreatePayload>
  ): Promise<IWorkspaceSprint> {
    return this.patch(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async archive(workspaceSlug: string, sprintId: string): Promise<{ archived_at: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unarchive(workspaceSlug: string, sprintId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listAutomations(workspaceSlug: string, params?: { archived?: boolean }): Promise<IWorkspaceSprintAutomation[]> {
    return this.listSquads(workspaceSlug, params);
  }

  async listSquads(workspaceSlug: string, params?: { archived?: boolean }): Promise<IWorkspaceSprintAutomation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/sprint-squads/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAutomation(
    workspaceSlug: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ): Promise<IWorkspaceSprintAutomation> {
    return this.createSquad(workspaceSlug, data);
  }

  async createSquad(
    workspaceSlug: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ): Promise<IWorkspaceSprintAutomation> {
    return this.post(`/api/workspaces/${workspaceSlug}/sprint-squads/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAutomation(
    workspaceSlug: string,
    automationId: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ): Promise<IWorkspaceSprintAutomation> {
    return this.updateSquad(workspaceSlug, automationId, data);
  }

  async updateSquad(
    workspaceSlug: string,
    squadId: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ): Promise<IWorkspaceSprintAutomation> {
    return this.patch(`/api/workspaces/${workspaceSlug}/sprint-squads/${squadId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAutomation(workspaceSlug: string, automationId: string): Promise<void> {
    return this.deleteSquad(workspaceSlug, automationId);
  }

  async deleteSquad(workspaceSlug: string, squadId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/sprint-squads/${squadId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async archiveAutomation(workspaceSlug: string, automationId: string): Promise<IWorkspaceSprintAutomation> {
    return this.archiveSquad(workspaceSlug, automationId);
  }

  async archiveSquad(workspaceSlug: string, squadId: string): Promise<IWorkspaceSprintAutomation> {
    return this.post(`/api/workspaces/${workspaceSlug}/sprint-squads/${squadId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreAutomation(workspaceSlug: string, automationId: string): Promise<IWorkspaceSprintAutomation> {
    return this.restoreSquad(workspaceSlug, automationId);
  }

  async restoreSquad(workspaceSlug: string, squadId: string): Promise<IWorkspaceSprintAutomation> {
    return this.delete(`/api/workspaces/${workspaceSlug}/sprint-squads/${squadId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listAutomationMembers(
    workspaceSlug: string,
    automationId: string
  ): Promise<IWorkspaceSprintAutomationMember[]> {
    return this.listSquadMembers(workspaceSlug, automationId);
  }

  async listSquadMembers(workspaceSlug: string, squadId: string): Promise<IWorkspaceSprintAutomationMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/sprint-squads/${squadId}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAutomationMembers(
    workspaceSlug: string,
    automationId: string,
    memberIds: string[]
  ): Promise<IWorkspaceSprintAutomationMember[]> {
    return this.updateSquadMembers(workspaceSlug, automationId, memberIds);
  }

  async updateSquadMembers(
    workspaceSlug: string,
    squadId: string,
    memberIds: string[]
  ): Promise<IWorkspaceSprintAutomationMember[]> {
    return this.patch(`/api/workspaces/${workspaceSlug}/sprint-squads/${squadId}/members/`, {
      member_ids: memberIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssue(workspaceSlug: string, sprintId: string, issueId: string): Promise<WorkspaceSprintIssueResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/issues/`, { issue_id: issueId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeIssue(workspaceSlug: string, sprintId: string, issueId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
