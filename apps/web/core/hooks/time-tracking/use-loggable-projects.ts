/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import { useTimeTrackingPermissions } from "./use-time-tracking-permissions";

/**
 * Projects the current user can log time in, so dropdowns only offer those.
 * - `ownProjectIds`: where they're an Admin/Member (timers, own time)
 * - `forOthersProjectIds`: where they can log for someone else (project admin, or any project for workspace admins)
 */
export const useLoggableProjects = (workspaceSlug?: string) => {
  const { joinedProjectIds, workspaceProjectIds } = useProject();
  const { canLogOwn, canLogForOthers, isWorkspaceAdmin } = useTimeTrackingPermissions(workspaceSlug);

  const ownProjectIds = useMemo(() => joinedProjectIds.filter((id) => canLogOwn(id)), [joinedProjectIds, canLogOwn]);
  const forOthersProjectIds = useMemo(
    () => (isWorkspaceAdmin ? (workspaceProjectIds ?? []) : joinedProjectIds).filter((id) => canLogForOthers(id)),
    [isWorkspaceAdmin, workspaceProjectIds, joinedProjectIds, canLogForOthers]
  );

  return { ownProjectIds, forOthersProjectIds, canLogOwn, canLogForOthers };
};
