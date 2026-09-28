/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { EUserWorkspaceRoles } from "@plane/types";
import { useUser } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { dashboardPreferencesStore, type TViewMode } from "@/store/dashboard-preferences.store";

/**
 * Seed `dashboardPreferencesStore` once per `(workspace, user)` on first mount:
 *
 * - ADMIN (and above) → `team` view, no assignee filter.
 * - everyone else (MEMBER, GUEST) → `personal` view, assignees scoped to me.
 *
 * A pre-existing `viewMode` in the persisted scope wins, so a user who has
 * already configured their dashboard is never overwritten. The same identity
 * keeps the effect from re-running; switching identity is the shell's job.
 */
export function useDashboardSmartDefault(): { viewMode: TViewMode | null; isResolving: boolean } {
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (!currentUser || !currentWorkspace) return;
    const userId = currentUser.id;
    const existing = dashboardPreferencesStore.getViewMode();
    if (existing) return; // persisted scope wins

    if (currentUser.role === EUserWorkspaceRoles.ADMIN) {
      dashboardPreferencesStore.setViewMode("team");
    } else {
      dashboardPreferencesStore.setViewMode("personal");
      dashboardPreferencesStore.setGlobalScope({ filters: { assignees: [userId] } });
    }
    // identity is the only trigger; the store singleton owns the rest
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role, currentWorkspace?.id]);

  return {
    viewMode: dashboardPreferencesStore.getViewMode(),
    isResolving: !currentUser || !currentWorkspace,
  };
}
