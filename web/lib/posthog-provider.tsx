import { FC, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
// constants
import { GROUP_WORKSPACE } from "constants/event-tracker";
// types
import { IUser } from "@plane/types";

export interface IPosthogWrapper {
  children: ReactNode;
  user: IUser | null;
  workspaceIds: string[];
  currentWorkspaceId: string | undefined;
  posthogAPIKey: string | null;
  posthogHost: string | null;
  isCloud: boolean;
  telemetryEnabled: boolean;
}

const PostHogProvider: FC<IPosthogWrapper> = (props) => {
  const {
    children,
    user,
    workspaceIds,
    currentWorkspaceId,
    posthogAPIKey,
    posthogHost,
    isCloud = true,
    telemetryEnabled = false,
  } = props;
  // states
  const [lastWorkspaceId, setLastWorkspaceId] = useState(currentWorkspaceId);
  // router
  const router = useRouter();

  if (!isCloud && !telemetryEnabled) return <>{children}</>;

  useEffect(() => {
    if (user) {
      // Identify sends an event, so you want may want to limit how often you call it
      posthog?.identify(
        isCloud ? user.email : user.id,
        isCloud
          ? {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              use_case: user.use_case,
              workspaces: workspaceIds,
            }
          : undefined
      );
    }
  }, [user, workspaceIds, isCloud]);

  useEffect(() => {
    if (posthogAPIKey && posthogHost && (isCloud || (!isCloud && telemetryEnabled))) {
      posthog.init(posthogAPIKey, {
        api_host: posthogHost || "https://app.posthog.com",
        debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "1", // Debug mode based on the environment variable
        autocapture: false,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      });
    }
  }, [posthogAPIKey, posthogHost, isCloud, telemetryEnabled]);

  useEffect(() => {
    // Join workspace group on workspace change
    if (lastWorkspaceId !== currentWorkspaceId && currentWorkspaceId && user) {
      setLastWorkspaceId(currentWorkspaceId);
      posthog?.identify(isCloud ? user.email : user.id);
      posthog?.group(GROUP_WORKSPACE, currentWorkspaceId);
    }
  }, [currentWorkspaceId, lastWorkspaceId, user, isCloud]);

  useEffect(() => {
    // Track page views
    const handleRouteChange = () => {
      posthog?.capture("$pageview");
    };
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (posthogAPIKey) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }
  return <>{children}</>;
};

export default PostHogProvider;
