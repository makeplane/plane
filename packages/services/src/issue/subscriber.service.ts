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

// services
import { APIService } from "../api.service";

type IssueSubscriberStatusResponse = {
  subscribed: boolean;
};

export class IssueSubscriberService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async status(workspaceSlug: string, projectId: string, issueId: string): Promise<IssueSubscriberStatusResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribers/me/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unsubscribe(workspaceSlug: string, projectId: string, issueId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribers/me/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async subscribe(workspaceSlug: string, projectId: string, issueId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribers/me/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async list(workspaceSlug: string, projectId: string, issueId: string): Promise<string[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribers/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, projectId: string, issueId: string, subscriberIds: string[]): Promise<string[]> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/subscribers/`, {
      subscriber_ids: subscriberIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
