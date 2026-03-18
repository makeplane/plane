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

import type { ClientOptions } from "@/types";
import { APIService } from "../api.service";
import type { AxiosError } from "axios";
import type { ExRelease } from "@plane/sdk";
import type { TBulkOperationResponse } from "@/types/services";

export type TReleaseBulkOperationResponse = TBulkOperationResponse<ExRelease>;

export class ReleaseAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async bulkCreateOrUpdateReleases(
    workspaceSlug: string,
    payload: Partial<ExRelease>[]
  ): Promise<TReleaseBulkOperationResponse> {
    return this.post(`/api/silo/workspaces/${workspaceSlug}/releases/bulk-operation/`, payload)
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}
