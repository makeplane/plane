"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
// constants
import { GROUP_WORKSPACE } from "@/constants/event-tracker";
// helpers
import { getUserRole } from "@/helpers/user.helper";
// hooks
import { useWorkspace, useUser, useInstance } from "@/hooks/store";
// types

export interface IPosthogWrapper {
  children: ReactNode;
}

const PostHogProvider: FC<IPosthogWrapper> = observer((props) => {
  const { children } = props;
  const {
    data: user,
    membership: { currentProjectRole, currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { instance } = useInstance();

  const is_telemetry_enabled = instance?.is_telemetry_enabled || false;

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
        posthog?.group(GROUP_WORKSPACE, currentWorkspace?.id);
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
      });
    }
  }, []);

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST && is_telemetry_enabled)
    return <PHProvider client={posthog}>{children}</PHProvider>;

  return <>{children}</>;
});

export default PostHogProvider;
