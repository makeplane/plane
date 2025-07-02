"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
// constants
import { GROUP_WORKSPACE_TRACKER_EVENT } from "@plane/constants";
// helpers
import { getUserRole } from "@plane/utils";
// hooks
import { captureClick, joinEventGroup } from "@/helpers/event-tracker.helper";
import { useWorkspace, useUser, useInstance, useUserPermissions } from "@/hooks/store";
// dynamic imports
const PostHogPageView = dynamic(() => import("@/lib/posthog-view"), { ssr: false });

export interface IPosthogWrapper {
  children: ReactNode;
}

const PostHogProvider: FC<IPosthogWrapper> = observer((props) => {
  const { children } = props;
  const { data: user } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { instance } = useInstance();
  const { workspaceSlug, projectId } = useParams();
  const { getWorkspaceRoleByWorkspaceSlug, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();

  const currentProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(
    workspaceSlug?.toString(),
    projectId?.toString()
  );
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug?.toString());
  const is_telemetry_enabled = instance?.is_telemetry_enabled || false;
  const is_posthog_enabled =
    process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST && is_telemetry_enabled;

  useEffect(() => {
    if (user) {
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
  }, [user, currentProjectRole, currentWorkspaceRole, currentWorkspace]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "1", // Debug mode based on the environment variable
        autocapture: false,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        capture_pageleave: true,
        disable_session_recording: true,
      });
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

    if (is_posthog_enabled) {
      document.addEventListener("click", clickHandler);
    }

    return () => {
      document.removeEventListener("click", clickHandler);
    };
  }, [is_posthog_enabled]);

  if (is_posthog_enabled)
    return (
      <PHProvider client={posthog}>
        <PostHogPageView />
        {children}
      </PHProvider>
    );

  return <>{children}</>;
});

export default PostHogProvider;
