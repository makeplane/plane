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

import type { AxiosInstance } from "axios";
import axios from "axios";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import type { JiraResource, JiraProject, JiraStates, JiraPriority } from "@plane/etl/jira";
import type { IAdditionalUsersResponse, IJiraValidateJQLResponse } from "@plane/types";

export class JiraServerDataService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description get workspaces
   * @property workspaceId: string
   * @property userId: string
   * @returns workspaces | undefined
   */
  async getResources(workspaceId: string, userId: string): Promise<JiraResource[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/resources/`, {
        workspaceId,
        userId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get projects
   * @property workspaceId: string
   * @property userId: string
   * @returns projects | undefined
   */
  async getProjects(workspaceId: string, userId: string): Promise<JiraProject[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/projects/`, { workspaceId, userId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project states
   * @property workspaceId: string
   * @property userId: string
   * @property projectId: string
   * @returns states | undefined
   */
  async getProjectStates(
    workspaceId: string,
    userId: string,
    resourceId: string | undefined,
    projectId: string
  ): Promise<JiraStates[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/states/`, {
        workspaceId,
        userId,
        projectId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project priorities
   * @property workspaceId: string
   * @property userId: string
   * @property projectId: string
   * @returns priorities | undefined
   */
  async getProjectPriorities(
    workspaceId: string,
    userId: string,
    projectId: string
  ): Promise<JiraPriority[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/priorities/`, {
        workspaceId,
        userId,
        projectId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project labels
   * @property workspaceId: string
   * @property userId: string
   * @returns project | undefined
   */
  async getProjectLabels(workspaceId: string, userId: string, projectId: string): Promise<string[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/labels/`, {
        workspaceId,
        userId,
        projectId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project issues count
   * @property workspaceId: string
   * @property userId: string
   * @property projectId: string
   * @returns project | undefined
   */
  async getProjectIssuesCount(
    workspaceId: string,
    userId: string,
    projectId: string,
    jql?: string
  ): Promise<number | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/issue-count/`, {
        workspaceId,
        userId,
        projectId,
        jql,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get additional users while import
   * @property workspaceId: string
   * @property userId: string
   * @property workspaceSlug: string
   */
  async getAdditionalUsers(
    workspaceId: string,
    userId: string,
    workspaceSlug: string
  ): Promise<IAdditionalUsersResponse | undefined> {
    return this.axiosInstance
      .get(
        `/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/additional-users/${workspaceId}/${workspaceSlug}/${userId}`,
        {}
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description validate jql
   * @property workspaceId: string
   * @property userId: string
   * @property projectKey: string
   * @property jql: string
   * @returns IJiraValidateJQLResponse | undefined
   */
  async validateJql(
    workspaceId: string,
    userId: string,
    projectKey: string,
    jql: string
  ): Promise<IJiraValidateJQLResponse> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/validate-jql/`, {
        workspaceId,
        userId,
        projectKey,
        jql,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
