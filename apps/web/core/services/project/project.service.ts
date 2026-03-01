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

import { API_BASE_URL } from "@plane/constants";
import type {
  GithubRepositoriesResponse,
  IProjectSubscriber,
  IProjectUserPropertiesResponse,
  ISearchIssueResponse,
  TProjectAnalyticsCount,
  TProjectAnalyticsCountParams,
  TProjectAttributesParams,
  TProjectAttributesResponse,
  TProjectFeatures,
  TProjectIssuesSearchParams,
  TProjectLink,
  TStateAnalytics,
} from "@plane/types";
// helpers
// plane web types
import type { TProject, TPartialProject } from "@/types";
// services
import { APIService } from "@/services/api.service";

export class ProjectService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createProject(workspaceSlug: string, data: Partial<TProject>): Promise<TProject> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async checkProjectIdentifierAvailability(workspaceSlug: string, data: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-identifiers`, {
      params: {
        name: data,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectsLite(workspaceSlug: string): Promise<TPartialProject[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjects(workspaceSlug: string): Promise<TProject[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/details/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProject(workspaceSlug: string, projectId: string): Promise<TProject> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getProjectAnalyticsCount(
    workspaceSlug: string,
    params?: TProjectAnalyticsCountParams
  ): Promise<TProjectAnalyticsCount[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-stats/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProject(workspaceSlug: string, projectId: string, data: Partial<TProject>): Promise<TProject> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProject(workspaceSlug: string, projectId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // User Properties
  async getProjectUserProperties(workspaceSlug: string, projectId: string): Promise<IProjectUserPropertiesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectUserProperties(
    workspaceSlug: string,
    projectId: string,
    data: Partial<IProjectUserPropertiesResponse>
  ): Promise<IProjectUserPropertiesResponse> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getGithubRepositories(url: string): Promise<GithubRepositoriesResponse> {
    return this.request({
      method: "get",
      url,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async syncGithubRepository(
    workspaceSlug: string,
    projectId: string,
    workspaceIntegrationId: string,
    data: {
      name: string;
      owner: string;
      repository_id: string;
      url: string;
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workspace-integrations/${workspaceIntegrationId}/github-repository-sync/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectGithubRepository(workspaceSlug: string, projectId: string, integrationId: string): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workspace-integrations/${integrationId}/github-repository-sync/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUserProjectFavorites(workspaceSlug: string): Promise<any[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-favorite-projects/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addProjectToFavorites(workspaceSlug: string, project: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/user-favorite-projects/`, { project })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeProjectFromFavorites(workspaceSlug: string, projectId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/user-favorite-projects/${projectId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async projectIssuesSearch(
    workspaceSlug: string,
    projectId: string,
    params: TProjectIssuesSearchParams
  ): Promise<ISearchIssueResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/search-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // create project using template
  async createProjectUsingTemplate(
    workspaceSlug: string,
    templateId: string,
    data: Partial<TProject>
  ): Promise<TProject> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/use-template/`, {
      template_id: templateId,
      ...data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  // attributes
  async getProjectAttributes(
    workspaceSlug: string,
    params?: TProjectAttributesParams
  ): Promise<TProjectAttributesResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-attributes/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // analytics
  async fetchProjectAnalytics(workspaceSlug: string, projectId: string): Promise<TStateAnalytics> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/analytics/`);
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  // links
  async fetchProjectLinks(workspaceSlug: string, projectId: string): Promise<TProjectLink[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/links/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createProjectLink(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectLink>
  ): Promise<TProjectLink> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/links/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProjectLink(
    workspaceSlug: string,
    projectId: string,
    linkId: string,
    data: Partial<TProjectLink>
  ): Promise<TProjectLink> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/links/${linkId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteProjectLink(workspaceSlug: string, projectId: string, linkId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/links/${linkId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectFeatures(workspaceSlug: string): Promise<TProjectFeatures[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-project-features/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async toggleProjectFeatures(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectFeatures>
  ): Promise<TProjectFeatures> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/features/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  // Work item CSV import
  async importWorkItemsFromCSV(
    workspaceSlug: string,
    projectId: string,
    assetId: string
  ): Promise<{ message: string; job_id: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/import/`, {
      asset_id: assetId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // project subscribers
  async getProjectSubscribers(workspaceSlug: string, projectId: string): Promise<IProjectSubscriber[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/subscribers/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectSubscribers(
    workspaceSlug: string,
    projectId: string,
    subscriberIds: string[]
  ): Promise<IProjectSubscriber[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/subscribers/`, {
      subscriber_ids: subscriberIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const projectService = new ProjectService();

export default projectService;
