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

// plane imports
import { API_BASE_URL } from "@plane/constants";
import { EIssueServiceType } from "@plane/types";
import type { TIssuePropertiesActivity, TIssueServiceType } from "@plane/types";

// services
import { APIService } from "@/services/api.service";

export class IssuePropertiesActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    params:
      | {
          created_at__gt: string;
        }
      | object = {},
    serviceType: TIssueServiceType = EIssueServiceType.ISSUES
  ): Promise<TIssuePropertiesActivity[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${serviceType === EIssueServiceType.EPICS ? "epics" : "issues"}/${issueId}/property-activity/`,
      {
        params,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
