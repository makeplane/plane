import { FC, ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
// mobx store provider
import { IUser } from "@plane/types";
// helpers
import { getUserRole } from "helpers/user.helper";

export interface IPosthogWrapper {
  children: ReactNode;
  user: IUser | null;
  workspaceRole: number | undefined;
  projectRole: number | undefined;
  posthogAPIKey: string | null;
  posthogHost: string | null;
}

const PosthogWrapper: FC<IPosthogWrapper> = (props) => {
  const { children, user, workspaceRole, projectRole, posthogAPIKey, posthogHost } = props;
  // router
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Identify sends an event, so you want may want to limit how often you call it
      posthog?.identify(user.email, {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        id: user.id,
        workspace_role: workspaceRole ? getUserRole(workspaceRole) : undefined,
        project_role: projectRole ? getUserRole(projectRole) : undefined,
      });
    }
  }, [user, workspaceRole, projectRole]);

  useEffect(() => {
    if (posthogAPIKey && posthogHost) {
      posthog.init(posthogAPIKey, {
        api_host: posthogHost || "https://app.posthog.com",
        // Enable debug mode in development
        // loaded: (posthog) => {
        //   if (process.env.NODE_ENV === "development") posthog.debug();
        // },
        autocapture: false,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      });
    }
  }, [posthogAPIKey, posthogHost]);

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
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }
  return <>{children}</>;
};

export default PosthogWrapper;
