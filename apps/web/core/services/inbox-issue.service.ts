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
import type { TInboxForm } from "@plane/types";
// services
import { InboxIssueService as CeInboxIssueService } from "@/services/inbox";

export class InboxIssueService extends CeInboxIssueService {
  constructor() {
    super();
  }

  async retrievePublishForm(workspaceSlug: string, projectId: string): Promise<TInboxForm> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePublishForm(workspaceSlug: string, projectId: string, data: Partial<TInboxForm>): Promise<TInboxForm> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-settings/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async regeneratePublishForm(
    workspaceSlug: string,
    projectId: string,
    featureType: string
  ): Promise<{ anchor: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/publish-intake-regenerate/${featureType}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
