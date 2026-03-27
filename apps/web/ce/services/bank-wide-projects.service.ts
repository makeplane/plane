/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IBankWideProject } from "@plane/types";
import { APIService } from "@/services/api.service";

export class BankWideProjectsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string): Promise<IBankWideProject[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/bank-wide-projects/`)
      .then(({ data }: { data: IBankWideProject[] }) => data)
      .catch((error: { response?: { data: unknown } }) => {
        throw error?.response?.data;
      });
  }
}
