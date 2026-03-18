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
import type { TBitbucketRepository } from "@plane/types";

export class BitbucketDataService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = `${baseURL}/api/bitbucket-dc`;
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  fetchBitbucketRepositories = async (workspaceId: string): Promise<TBitbucketRepository[] | undefined> =>
    await this.axiosInstance
      .get(`/repositories/${workspaceId}`)
      .then((res) => res.data as TBitbucketRepository[])
      .catch((error: unknown) => {
        throw (error as { response?: { data?: unknown } })?.response?.data;
      });
}
