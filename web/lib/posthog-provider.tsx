import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
// import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
// constants
import { GROUP_WORKSPACE } from "@/constants/event-tracker";
// helpers
import { getUserRole } from "@/helpers/user.helper";
// hooks
import { useWorkspace, useUser } from "@/hooks/store";
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
  // router
  // const router = useRouter();

  useEffect(() => {
    if (user) {
      // Identify sends an event, so you want may want to limit how often you call it
      posthog?.identify(user.email, {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        // use_case: user.use_case, FIXME:
        workspace_role: currentWorkspaceRole ? getUserRole(currentWorkspaceRole) : undefined,
        project_role: currentProjectRole ? getUserRole(currentProjectRole) : undefined,
      });
    }
  }, [user, currentProjectRole, currentWorkspaceRole]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "1", // Debug mode based on the environment variable
        autocapture: false,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      });
    }
  }, []);

  useEffect(() => {
    // Join workspace group on workspace change
    if (currentWorkspace?.id && user?.email) {
      posthog?.identify(user?.email);
      posthog?.group(GROUP_WORKSPACE, currentWorkspace?.id);
    }
  }, [currentWorkspace?.id, user?.email]);

  useEffect(() =>
    // Track page views
    // const handleRouteChange = () => {
    //   posthog?.capture("$pageview");
    // };
    // router.events.on("routeChangeComplete", handleRouteChange);

    () => {
      // router.events.off("routeChangeComplete", handleRouteChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , []);

  if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST)
    return <PHProvider client={posthog}>{children}</PHProvider>;

  return <>{children}</>;
});

export default PostHogProvider;
