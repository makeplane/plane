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
import type { ClientOptions, ExcludedProps, ExIssueLabel, Optional, Paginated } from "@/types/types";

export class LabelService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async list(slug: string, projectId: string): Promise<Paginated<ExIssueLabel>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/labels/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    slug: string,
    projectId: string,
    payload: Omit<Optional<ExIssueLabel>, ExcludedProps>
  ): Promise<ExIssueLabel> {
    return this.post(`/api/v1/workspaces/${slug}/projects/${projectId}/labels/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(slug: string, projectId: string, labelId: string, payload: Omit<Optional<ExIssueLabel>, ExcludedProps>) {
    return this.patch(`/api/v1/workspaces/${slug}/projects/${projectId}/labels/${labelId}/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(slug: string, projectId: string, labelId: string) {
    return this.delete(`/api/v1/workspaces/${slug}/projects/${projectId}/labels/${labelId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
