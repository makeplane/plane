/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { mutate } from "swr";
// hooks
import { useUser } from "@/hooks/store/user/user-user";
import { usePomodoroTimerStore } from "@/hooks/store/use-pomodoro-timer-store";
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { SyncSocketService, type TSyncEvent } from "@/services/sync/sync-socket.service";

/**
 * Opens one `/sync` connection for the active workspace and turns pushed
 * events into local updates:
 *  - issue/comment/cycle/module/project events invalidate the matching SWR
 *    keys in place (`revalidate: true` lets SWR re-fetch just that entity and
 *    patch already-rendered cards/lists rather than a full page reload —
 *    this is deliberately a targeted revalidate, not a global `mutate()`).
 *  - pomodoro_timer events re-fetch the pomodoro store's active timer, which
 *    already derives remaining time from `started_at`/`paused_seconds` (see
 *    hooks/pomodoro/use-pomodoro-timer.ts) rather than counting down locally,
 *    so a fresh row from any device is immediately correct everywhere.
 *
 * Mount once per workspace (see the `[workspaceSlug]/layout.tsx` provider) —
 * the underlying WebSocket handles its own reconnect/replay via a persisted
 * cursor, so remounts on navigation are cheap no-ops as long as the
 * workspace doesn't change.
 */
export const useSyncSocket = (workspaceSlug: string | undefined) => {
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  const pomodoroTimer = usePomodoroTimerStore();

  useEffect(() => {
    if (!workspaceSlug || !currentWorkspace?.id || !currentUser?.id) return;

    const socket = new SyncSocketService(workspaceSlug, currentWorkspace.id, currentUser.id);

    const revalidateByPrefix = (prefix: string) => (event: TSyncEvent) => {
      void mutate(
        (key) => typeof key === "string" && key.startsWith(prefix) && key.includes(event.entity_id),
        undefined,
        { revalidate: true }
      );
    };

    const unsubscribers = [
      socket.on("issue", revalidateByPrefix("/api/workspaces")),
      socket.on("issue_comment", revalidateByPrefix("/api/workspaces")),
      socket.on("cycle", revalidateByPrefix("/api/workspaces")),
      socket.on("module", revalidateByPrefix("/api/workspaces")),
      socket.on("project", revalidateByPrefix("/api/workspaces")),
      socket.on("pomodoro_timer", () => {
        void pomodoroTimer.applyRemoteSyncEvent();
      }),
    ];

    socket.connect();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      socket.disconnect();
    };
  }, [workspaceSlug, currentWorkspace?.id, currentUser?.id, pomodoroTimer]);
};
