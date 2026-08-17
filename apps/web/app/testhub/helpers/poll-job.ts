/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { testhubService } from "@plane/services";

export async function pollJobUntilSettled(workspaceSlug: string, projectId: string, jobId: string, attemptsLeft = 60) {
  if (attemptsLeft <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const latest = await testhubService.getJob(workspaceSlug, projectId, jobId);
  if (latest.status === "succeeded" || latest.status === "failed") return latest;
  return pollJobUntilSettled(workspaceSlug, projectId, jobId, attemptsLeft - 1);
}
