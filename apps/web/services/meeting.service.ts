/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TIssue, TMeetingListItem } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

const data = <T>(request: Promise<{ data: T }>): Promise<T> =>
  request
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });

export class MeetingService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  list(
    workspaceSlug: string,
    projectId: string,
    params: { from: string; to: string } | { parent_id: string }
  ): Promise<TMeetingListItem[]> {
    return data(this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/meetings/`, { params }));
  }

  createTask(workspaceSlug: string, projectId: string, meetingId: string, name: string): Promise<TIssue> {
    return data(
      this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${meetingId}/create-task/`, { name })
    );
  }
}
