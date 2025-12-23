import { PostHogProvider as PHProvider } from "@posthog/react";
import { observer } from "mobx-react";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
// constants
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useInstance } from "@/hooks/store/use-instance";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { identifyUser, joinWorkspaceGroup } from "@/plane-web/helpers/event-tracker-v2.helper";
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
  const { data: profile } = useUserProfile();
  const { instance } = useInstance();
  const { currentWorkspace } = useWorkspace();
  // refs
  const isInitializedRef = useRef(false);
  // states
  const [hydrated, setHydrated] = useState(false);

  const is_telemetry_enabled = instance?.is_telemetry_enabled || false;
  const is_posthog_enabled = process.env.VITE_POSTHOG_KEY && process.env.VITE_POSTHOG_HOST && is_telemetry_enabled;

  useEffect(() => {
    if (user && profile && hydrated && is_posthog_enabled) {
      identifyUser(user, profile);
    }
  }, [user, profile, hydrated, is_posthog_enabled]);

  useEffect(() => {
    if (currentWorkspace && hydrated && is_posthog_enabled) {
      joinWorkspaceGroup(currentWorkspace);
    }
  }, [currentWorkspace, hydrated, is_posthog_enabled]);

  useEffect(() => {
    if (isInitializedRef.current) return; // prevent multiple initializations
    const posthogKey = process.env.VITE_POSTHOG_KEY;
    const posthogHost = process.env.VITE_POSTHOG_HOST;
    const isDebugMode = process.env.VITE_POSTHOG_DEBUG === "1";
    if (posthogKey && posthogHost && !posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        ui_host: posthogHost,
        debug: isDebugMode, // Debug mode based on the environment variable
        autocapture: false,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        capture_pageleave: true,
        disable_session_recording: true,
      });
      isInitializedRef.current = true;
      setHydrated(true);
    }
  }, []);

  const clickHandler = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    // Use closest to find the nearest parent element with data-ph-element attribute
    const elementWithAttribute = target.closest("[data-ph-element]") as HTMLElement;
    if (elementWithAttribute) {
      const element = elementWithAttribute.getAttribute("data-ph-element");
      if (element) {
        captureClick({ elementName: element });
      }
    }
  }, []);

  useEffect(() => {
    if (!is_posthog_enabled || !hydrated) return;

    document.addEventListener("click", clickHandler);

    return () => {
      document.removeEventListener("click", clickHandler);
    };
  }, [hydrated, is_posthog_enabled, clickHandler]);

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
