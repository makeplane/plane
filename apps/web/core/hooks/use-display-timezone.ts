/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

/**
 * Resolve the timezone to use when displaying times in the UI.
 *
 * Resolution order:
 * 1. The user's preferred timezone (`user_timezone`). `"UTC"` is treated as
 *    "not set": it is the database default for users who never picked a
 *    timezone, and we cannot distinguish that from a user who deliberately
 *    chose UTC. The workspace timezone is the better fallback for those users.
 * 2. The current workspace's timezone, which the organization has explicitly
 *    declared in workspace settings.
 * 3. `undefined`, which makes the Intl APIs fall back to the browser's local
 *    timezone.
 */
export const resolveDisplayTimezone = (
  userTimezone: string | undefined,
  workspaceTimezone: string | undefined
): string | undefined => {
  if (userTimezone && userTimezone !== "UTC") return userTimezone;
  if (workspaceTimezone) return workspaceTimezone;
  return undefined;
};

/**
 * Hook variant of `resolveDisplayTimezone` that reads the current workspace
 * from the store.
 */
export const useDisplayTimezone = (userTimezone: string | undefined): string | undefined => {
  const { currentWorkspace } = useWorkspace();
  return resolveDisplayTimezone(userTimezone, currentWorkspace?.timezone);
};
