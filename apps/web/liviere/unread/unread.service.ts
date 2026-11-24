/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: app endpoints of "New" work items (apps/api/plane/liviere/app/unread.py).

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type { TNewWorkItemsCount, TNewWorkItemsPage } from "./types";

export const NEW_WORK_ITEMS_PAGE_SIZE = 50;

export class NewWorkItemsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private url(workspaceSlug: string, path = "") {
    return `/api/workspaces/${workspaceSlug}/liviere/new-work-items/${path}`;
  }

  private unwrap<T>(request: Promise<{ data: T }>): Promise<T> {
    return request
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async list(
    workspaceSlug: string,
    projectIds: string[],
    olderThan?: { created_at: string; id: string }
  ): Promise<TNewWorkItemsPage> {
    return this.unwrap(
      this.get(this.url(workspaceSlug), {
        params: {
          per_page: NEW_WORK_ITEMS_PAGE_SIZE,
          ...(projectIds.length ? { projects: projectIds.join(",") } : {}),
          ...(olderThan ? { older_than: olderThan.created_at, older_than_id: olderThan.id } : {}),
        },
      })
    );
  }

  async count(workspaceSlug: string): Promise<TNewWorkItemsCount> {
    return this.unwrap(this.get(this.url(workspaceSlug, "count/")));
  }

  async markAllRead(workspaceSlug: string, before: string, projectIds: string[]): Promise<{ cleared: number }> {
    return this.unwrap(
      this.post(this.url(workspaceSlug, "mark-read/"), {
        before,
        ...(projectIds.length ? { project_ids: projectIds } : {}),
      })
    );
  }

  async markOpened(workspaceSlug: string, projectId: string, workItemId: string): Promise<void> {
    await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/liviere/work-items/${workItemId}/opened/`);
  }
}

export const newWorkItemsService = new NewWorkItemsService();
