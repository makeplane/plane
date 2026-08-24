/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { EUserPermissions } from "@plane/constants";
import type { TWorkItemRealtimeEvent } from "@plane/types";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { rootStore } from "@/lib/store-context";
import { WorkItemRealtimeService } from "@/services/work-item-realtime.service";
import { applyWorkItemRealtimeEvent } from "@/store/issue/work-item-realtime";

const realtimeService = new WorkItemRealtimeService();

export const useWorkItemRealtime = (workspaceSlug?: string, projectId?: string) => {
  const { data: currentUser } = useUser();
  const { getProjectById } = useProject();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();

  useEffect(() => {
    if (!workspaceSlug || !projectId || !currentUser?.id) return;

    const handleEvent = (event: TWorkItemRealtimeEvent) => {
      const role = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
      const project = getProjectById(projectId);
      const isGuest = role === EUserPermissions.GUEST;
      if (
        isGuest &&
        !project?.guest_view_all_features &&
        event.issue?.created_by &&
        event.issue.created_by !== currentUser.id
      ) {
        return;
      }
      applyWorkItemRealtimeEvent(rootStore.issue, event);
    };

    realtimeService.connect({
      workspaceSlug,
      projectId,
      userId: currentUser.id,
      onEvent: handleEvent,
    });

    return () => {
      realtimeService.disconnect();
    };
  }, [workspaceSlug, projectId, currentUser?.id, getProjectById, getProjectRoleByWorkspaceSlugAndProjectId]);
};
