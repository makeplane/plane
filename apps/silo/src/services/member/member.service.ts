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

import type { AxiosError } from "axios";
import type { PlaneUser } from "@plane/sdk";
import type { ClientOptions } from "@/types";
import { APIService } from "../api.service";

export type TProjectMemberBulkCreatePayload = {
  email: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  role?: number;
  is_active?: boolean;
  avatar_asset_id?: string | null;
};

export type TProjectMemberBulkCreatedUser = Partial<PlaneUser> & {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
};

export type TProjectMemberBulkErrored = {
  payload: TProjectMemberBulkCreatePayload;
  error: string;
};

export type TProjectMemberBulkResponse = {
  created: TProjectMemberBulkCreatedUser[];
  errored: TProjectMemberBulkErrored[];
};

export class MemberAPIService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  /**
   * Bulk create users + workspace/project memberships via the silo bulk member endpoint.
   *
   * Endpoint deactivates users when `is_active: false` is set explicitly in the payload
   * OR when the workspace would exceed its available seat budget — letting importer flows
   * stay within billing limits without extra pre-checks.
   */
  async bulkCreateProjectMembers(
    workspaceSlug: string,
    projectId: string,
    payload: TProjectMemberBulkCreatePayload[]
  ): Promise<TProjectMemberBulkResponse> {
    return this.post(`/api/silo/workspaces/${workspaceSlug}/projects/${projectId}/members/bulk/`, payload)
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        throw error?.response?.data;
      });
  }
}
