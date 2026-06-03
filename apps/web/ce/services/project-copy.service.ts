/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { APIService } from "@/services/api.service";
import type { IProjectCopyJob } from "@/plane-web/types/project-copy";

export class CEProjectCopyService extends APIService {
  constructor() {
    super(""); // empty string — uses proxy
  }

  /** POST /api/workspaces/{slug}/projects/{projectId}/copy/ */
  copyProject(
    workspaceSlug: string,
    projectId: string,
    data: {
      target_workspace_slug: string;
      identifier: string;
      name?: string;
    }
  ): Promise<{ job_id: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/copy/`, data)
      .then((res: { data: { job_id: string } }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** GET /api/workspaces/{slug}/projects/{projectId}/copy-status/{jobId}/ */
  getCopyStatus(workspaceSlug: string, projectId: string, jobId: string): Promise<IProjectCopyJob> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/copy-status/${jobId}/`)
      .then((res: { data: IProjectCopyJob }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}

export const ceProjectCopyService = new CEProjectCopyService();
