/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TProjectCopyJobStatus = "queued" | "processing" | "completed" | "failed";

export interface IProjectCopyJob {
  job_id: string;
  status: TProjectCopyJobStatus;
  new_project_id: string | null;
  error: string | null;
}
