"use client";

import type { ReactNode } from "react";
import { lazy, Suspense, useEffect, useState } from "react";
import { PostHogProvider as PHProvider } from "@posthog/react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
// constants
import { GROUP_WORKSPACE_TRACKER_EVENT } from "@plane/constants";
// helpers
import { getUserRole } from "@plane/utils";
// hooks
import { captureClick, joinEventGroup } from "@/helpers/event-tracker.helper";
import { useInstance } from "@/hooks/store/use-instance";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// dynamic imports
const PostHogPageView = lazy(function PostHogPageView() {
  return import("@/lib/posthog-view");
});

export interface IPosthogWrapper {
  children: ReactNode;
}

const PostHogProvider = observer(function PostHogProvider(props: IPosthogWrapper) {
  const { children } = props;
  const { data: user } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { instance } = useInstance();
  const { workspaceSlug, projectId } = useParams();
  const { getWorkspaceRoleByWorkspaceSlug, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  // states
  const [hydrated, setHydrated] = useState(false);
  // derived values
  const currentProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(
    workspaceSlug?.toString(),
    projectId?.toString()
  );
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug?.toString());
  const is_telemetry_enabled = instance?.is_telemetry_enabled || false;
  const is_posthog_enabled = process.env.VITE_POSTHOG_KEY && process.env.VITE_POSTHOG_HOST && is_telemetry_enabled;

  useEffect(() => {
    if (user && hydrated) {
      // Identify sends an event, so you want may want to limit how often you call it
      posthog?.identify(user.email, {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        workspace_role: currentWorkspaceRole ? getUserRole(currentWorkspaceRole) : undefined,
        project_role: currentProjectRole ? getUserRole(currentProjectRole) : undefined,
      });
      if (currentWorkspace) {
        joinEventGroup(GROUP_WORKSPACE_TRACKER_EVENT, currentWorkspace?.id, {
          date: new Date().toDateString(),
          workspace_id: currentWorkspace?.id,
        });
      }
    }
  }, [user, currentProjectRole, currentWorkspaceRole, currentWorkspace, hydrated]);

  useEffect(() => {
    const posthogKey = process.env.VITE_POSTHOG_KEY;
    const posthogHost = process.env.VITE_POSTHOG_HOST;
    const isDebugMode = process.env.VITE_POSTHOG_DEBUG === "1";
    if (posthogKey && posthogHost) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        ui_host: posthogHost,
        debug: isDebugMode, // Debug mode based on the environment variable
        autocapture: false,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        capture_pageleave: true,
        disable_session_recording: true,
      });
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Use closest to find the nearest parent element with data-ph-element attribute
      const elementWithAttribute = target.closest("[data-ph-element]") as HTMLElement;
      if (elementWithAttribute) {
        const element = elementWithAttribute.getAttribute("data-ph-element");
        if (element) {
          captureClick({ elementName: element });
        }
      }
    };

    if (is_posthog_enabled && hydrated) {
      document.addEventListener("click", clickHandler);
    }

    return () => {
      document.removeEventListener("click", clickHandler);
    };
  }, [hydrated, is_posthog_enabled]);

  if (is_posthog_enabled && hydrated)
    return (
      <PHProvider client={posthog}>
        <Suspense>
          <PostHogPageView />
        </Suspense>
        {children}
      </PHProvider>
    );

  return <>{children}</>;
});

export default PostHogProvider;
