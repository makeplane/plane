/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { mutate } from "swr";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TMembershipRealtimeEvent } from "@plane/types";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { MembershipRealtimeService } from "@/services/membership-realtime.service";

const membershipRealtimeService = new MembershipRealtimeService();

export const useMembershipRealtime = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = useParams();
  const { data: currentUser } = useUser();
  const { clearWorkspaceAccess, clearProjectAccess } = useUserPermissions();
  const { getWorkspaceRedirectionUrl, fetchWorkspaces } = useWorkspace();

  useEffect(() => {
    if (!currentUser?.id) return;

    const handleEvent = async (event: TMembershipRealtimeEvent) => {
      if (event.user_id !== currentUser.id) return;

      if (event.type === "workspace.member.removed") {
        const slug = event.workspace_slug;
        clearWorkspaceAccess(slug);
        setToast({
          type: TOAST_TYPE.WARNING,
          title: "Access removed",
          message: "You were removed from this workspace. An admin must invite you again to rejoin.",
        });
        try {
          await fetchWorkspaces();
        } catch {
          // ignore refresh errors during forced logout from workspace
        }
        void mutate((key) => typeof key === "string" && key.includes(slug), undefined, { revalidate: false });
        router.replace(getWorkspaceRedirectionUrl() || "/");
        return;
      }

      if (event.type === "project.member.removed") {
        const slug = event.workspace_slug;
        const removedProjectId = event.project_id;
        if (!removedProjectId) return;

        clearProjectAccess(slug, removedProjectId);
        setToast({
          type: TOAST_TYPE.WARNING,
          title: "Access removed",
          message: "You were removed from this project. An admin must add you again to rejoin.",
        });
        if (workspaceSlug?.toString() === slug && projectId?.toString() === removedProjectId) {
          router.replace(`/${slug}/projects`);
        }
      }
    };

    membershipRealtimeService.connect({
      userId: currentUser.id,
      onEvent: (event) => {
        void handleEvent(event);
      },
    });

    return () => {
      membershipRealtimeService.disconnect();
    };
  }, [
    clearProjectAccess,
    clearWorkspaceAccess,
    currentUser?.id,
    fetchWorkspaces,
    getWorkspaceRedirectionUrl,
    projectId,
    router,
    workspaceSlug,
  ]);
};
