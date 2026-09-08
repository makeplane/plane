/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useParams } from "next/navigation";
// plane imports
import { LIVE_BASE_PATH, LIVE_BASE_URL } from "@plane/constants";
// hooks
import { useUser } from "@/hooks/store/user";

// Debounce window to coalesce bursts of issue events into a single refresh
const ISSUE_EVENT_DEBOUNCE_MS = 500;

type TIssueRealtimePayload = {
  event: string;
  data: {
    project_id: string;
    issue_id: string | null;
    type: string | null;
    actor_id: string | null;
  };
};

/**
 * Subscribes to realtime issue change events for a project over the live server
 * and invokes `onIssueEvent` (debounced) whenever another actor changes an issue.
 * @param projectId - The project to subscribe to
 * @param onIssueEvent - Callback invoked (debounced) on remote issue changes
 */
export const useIssueRealtime = (projectId: string | undefined, onIssueEvent: () => void) => {
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const { data: currentUser } = useUser();

  // Keep the latest callback and user id in refs so the provider is not
  // re-created when they change
  const onIssueEventRef = useRef(onIssueEvent);
  onIssueEventRef.current = onIssueEvent;
  const currentUserIdRef = useRef(currentUser?.id);
  currentUserIdRef.current = currentUser?.id;

  useEffect(() => {
    if (typeof window === "undefined" || !projectId || !currentUser?.id) return;

    // Construct the WebSocket collaboration URL, mirroring the page editor
    let wsLiveUrl: URL;
    try {
      const liveServerBaseUrl = LIVE_BASE_URL?.trim() || window.location.origin;
      wsLiveUrl = new URL(liveServerBaseUrl);
      const isSecureEnvironment = window.location.protocol === "https:";
      wsLiveUrl.protocol = isSecureEnvironment ? "wss" : "ws";
      wsLiveUrl.pathname = `${LIVE_BASE_PATH}/collaboration`;
      if (workspaceSlug) wsLiveUrl.searchParams.set("workspaceSlug", workspaceSlug);
      wsLiveUrl.searchParams.set("projectId", projectId);
      wsLiveUrl.searchParams.set("documentType", "project_page");
    } catch (error) {
      console.error("Error creating issue realtime config", error);
      return;
    }

    const provider = new HocuspocusProvider({
      name: `issue-events:${projectId}`,
      token: JSON.stringify({ id: currentUser.id, name: currentUser.display_name ?? "" }),
      url: wsLiveUrl.toString(),
    });

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleStateless = ({ payload }: { payload: string }) => {
      try {
        const parsedPayload = JSON.parse(payload) as TIssueRealtimePayload;
        if (parsedPayload.event !== "issue_changed") return;
        // ignore events triggered by the current user
        if (parsedPayload.data?.actor_id && parsedPayload.data.actor_id === currentUserIdRef.current) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          onIssueEventRef.current();
        }, ISSUE_EVENT_DEBOUNCE_MS);
      } catch (error) {
        console.error("Error handling issue realtime event", error);
      }
    };

    provider.on("stateless", handleStateless);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      provider.off("stateless", handleStateless);
      try {
        provider.destroy();
      } catch (error) {
        console.error("Error destroying issue realtime provider:", error);
      }
    };
  }, [projectId, workspaceSlug, currentUser?.id, currentUser?.display_name]);
};
