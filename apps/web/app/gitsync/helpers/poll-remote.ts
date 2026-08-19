/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { gitsyncService } from "@plane/services";
import type { TProjectGitRemote } from "@plane/types";

const SETTLED = new Set(["succeeded", "failed"]);

export async function pollRemoteUntilSettled(
  workspaceSlug: string,
  projectId: string,
  remoteId: string,
  attemptsLeft = 90
): Promise<TProjectGitRemote | undefined> {
  if (attemptsLeft <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const latest = await gitsyncService.listRemotes(workspaceSlug, projectId);
  const remote = latest.remotes.find((item) => item.id === remoteId);
  if (!remote) return;
  if (SETTLED.has(remote.last_sync_status)) return remote;
  return pollRemoteUntilSettled(workspaceSlug, projectId, remoteId, attemptsLeft - 1);
}
