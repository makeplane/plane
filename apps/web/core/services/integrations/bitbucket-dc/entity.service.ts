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
import type { TBitbucketEntityConnection } from "@plane/types";

export class BitbucketEntityService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  fetchEntityConnections = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityType?: string
  ): Promise<TBitbucketEntityConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}`, {
        params: { entityType },
      })
      .then((res) => res.data as TBitbucketEntityConnection[])
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  fetchEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityId: string
  ): Promise<TBitbucketEntityConnection | undefined> =>
    await this.axiosInstance
      .get(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}/${entityId}`)
      .then((res) => res.data as TBitbucketEntityConnection)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  createEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityConnection: Partial<TBitbucketEntityConnection>
  ): Promise<TBitbucketEntityConnection | undefined> =>
    await this.axiosInstance
      .post(`/api/bitbucket-dc/entity-connections/${workspaceId}/${workspaceConnectionId}`, entityConnection)
      .then((res) => res.data as TBitbucketEntityConnection)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  updateEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityId: string,
    entityConnection: Partial<TBitbucketEntityConnection>
  ): Promise<TBitbucketEntityConnection | undefined> =>
    await this.axiosInstance
      .put(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}/${entityId}`, entityConnection)
      .then((res) => res.data as TBitbucketEntityConnection)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });

  deleteEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityId: string
  ): Promise<void> =>
    await this.axiosInstance
      .delete(`/api/bitbucket-dc/entity-connections/${workspaceId}/${workspaceConnectionId}/${entityId}`)
      .then(() => undefined)
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
}
