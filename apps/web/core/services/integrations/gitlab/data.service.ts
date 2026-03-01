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
import type { IGitlabEntity } from "@plane/etl/gitlab";
import type { TGitlabRepository } from "@plane/types";

export class GitlabDataService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string, isEnterprise: boolean = false) {
    this.baseURL = `${baseURL}/api/${isEnterprise ? "gitlab-enterprise" : "gitlab"}`;
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  /**
   * @description fetch gitlab repositories
   * @param { string } workspaceId
   * @returns { Promise<TGitlabRepository[] | undefined> }
   */
  fetchGitlabRepositories = async (workspaceId: string): Promise<TGitlabRepository[] | undefined> =>
    await this.axiosInstance
      .get(`/${workspaceId}/repos`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description fetch gitlab entities
   * @param { string } workspaceId
   * @returns { Promise<IGitlabEntity[]> }
   */
  fetchGitlabEntities = async (workspaceId: string): Promise<IGitlabEntity[]> =>
    await this.axiosInstance
      .get(`/entities/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
