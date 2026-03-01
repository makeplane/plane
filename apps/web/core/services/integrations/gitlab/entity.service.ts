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
// plane web types
import type { TGitlabEntityConnection } from "@plane/types";

export class GitlabEntityService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;
  private isEnterprise: boolean;

  constructor(baseURL: string, isEnterprise: boolean = false) {
    this.baseURL = baseURL;
    this.isEnterprise = isEnterprise;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description fetch entity connections
   * @param { string } workspaceId
   * @returns { Promise<TGitlabEntityConnection[] | undefined> }
   */
  fetchEntityConnections = async (workspaceId: string): Promise<TGitlabEntityConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/api/${this.isEnterprise ? "gitlab-enterprise" : "gitlab"}/entity-connections/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description fetch entity connection
   * @param { string } connectionId
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  fetchEntityConnection = async (connectionId: string): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .get(`/api/entity-connections/${connectionId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description create entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { Partial<TGitlabEntityConnection> } entityConnection
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  createEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityConnection: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .post(
        `/api/${this.isEnterprise ? "gitlab-enterprise" : "gitlab"}/entity-connections/${workspaceId}/${workspaceConnectionId}`,
        entityConnection
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description create entity connection v2
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { Partial<TGitlabEntityConnection> } entityConnection
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  createEntityConnectionV2 = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityConnection: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .post(
        `/api/${this.isEnterprise ? "gitlab-enterprise" : "gitlab"}/entity-connections/v2/${workspaceId}/${workspaceConnectionId}`,
        entityConnection
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description update entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { string } connectionId
   * @param { Partial<TGitlabEntityConnection> } entityConnection
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  updateEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    connectionId: string,
    entityConnection: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .put(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}/${connectionId}`, entityConnection)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description delete entity connection
   * @param { string } connectionId
   * @returns { Promise<void> }
   */
  deleteEntityConnection = async (connectionId: string): Promise<void> =>
    await this.axiosInstance
      .delete(`/api/${this.isEnterprise ? "gitlab-enterprise" : "gitlab"}/entity-connections/${connectionId}`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description create project entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { Partial<TGitlabEntityConnection> } entityConnection
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  createProjectEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityConnection: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> =>
    await this.axiosInstance
      .post(
        `/api/${this.isEnterprise ? "gitlab-enterprise" : "gitlab"}/entity-project-connections/${workspaceId}/${workspaceConnectionId}`,
        entityConnection
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
