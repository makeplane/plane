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

// helpers
import { API_BASE_URL } from "@plane/constants";
// plane web types
import type { IAppSearchResults } from "@/types";
// services
import { APIService } from "@/services/api.service";

export class AppService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async searchApp(
    workspaceSlug: string,
    params: {
      search: string;
    }
  ): Promise<IAppSearchResults> {
    return this.get(`/api/workspaces/${workspaceSlug}/app-search/`, {
      params,
    })
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
