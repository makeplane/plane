import { FC, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { IUser, TUserProfile } from "@plane/types";
// constants
import { GROUP_WORKSPACE } from "@/constants/event-tracker";

export interface IPosthogWrapper {
  children: ReactNode;
  user: IUser | undefined;
  userProfile: TUserProfile | undefined;
  joinedWorkspaceIds: string[];
  currentWorkspaceId: string | undefined;
  posthogAPIKey: string | undefined;
  posthogHost: string | undefined;
  isTelemetryEnabled: boolean;
}

const PostHogProvider: FC<IPosthogWrapper> = (props) => {
  const {
    children,
    user,
    userProfile,
    joinedWorkspaceIds,
    currentWorkspaceId,
    posthogAPIKey,
    posthogHost,
    isTelemetryEnabled,
  } = props;
  // states
  const [lastWorkspaceId, setLastWorkspaceId] = useState(currentWorkspaceId);
  // router
  const router = useRouter();

  useEffect(() => {
    if (user && isTelemetryEnabled) {
      // Identify sends an event, so you want may want to limit how often you call it
      posthog?.identify(user.email, {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        use_case: userProfile?.use_case,
        role: userProfile?.role,
        workspaces: joinedWorkspaceIds,
      });
    }
  }, [user, joinedWorkspaceIds, isTelemetryEnabled, userProfile]);

  useEffect(() => {
    if (posthogAPIKey && (process.env.NEXT_PUBLIC_POSTHOG_HOST || posthogHost) && isTelemetryEnabled) {
      posthog.init(posthogAPIKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || posthogHost || "https://app.posthog.com",
        debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "1", // Debug mode based on the environment variable
        autocapture: false,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      });
      posthog?.opt_in_capturing();
    }
  }, [posthogAPIKey, posthogHost, isTelemetryEnabled]);

  useEffect(() => {
    // Join workspace group on workspace change
    if (lastWorkspaceId !== currentWorkspaceId && currentWorkspaceId && user && isTelemetryEnabled) {
      setLastWorkspaceId(currentWorkspaceId);
      posthog?.identify(user.email);
      posthog?.group(GROUP_WORKSPACE, currentWorkspaceId);
    }
  }, [currentWorkspaceId, lastWorkspaceId, user, isTelemetryEnabled]);

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

  if (!isTelemetryEnabled) {
    posthog?.opt_out_capturing();
    return <>{children}</>;
  }

  if (posthogAPIKey) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }
  return <>{children}</>;
};

export default PostHogProvider;
