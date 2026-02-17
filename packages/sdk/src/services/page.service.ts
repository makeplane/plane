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

import { APIService } from "@/services/api.service";
// types
import type { ClientOptions, ExPage } from "@/types/types";

export class PageService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async getWorkspacePage(slug: string, pageId: string): Promise<ExPage> {
    return this.get(`/api/v1/workspaces/${slug}/pages/${pageId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectPage(slug: string, projectId: string, pageId: string): Promise<ExPage> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/pages/${pageId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPublishedPage(anchor: string): Promise<ExPage> {
    return this.get(`/api/v1/pages/public/anchor/${anchor}/pages/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
