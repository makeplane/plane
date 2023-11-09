import { FC, ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
// mobx store provider
import { IUser } from "types";

export interface IPosthogWrapper {
  children: ReactNode;
  user: IUser;
  posthogAPIKey: string;
  posthogHost: string;
}

const PosthogWrapper: FC<IPosthogWrapper> = (props) => {
  const { children, user, posthogAPIKey, posthogHost } = props;
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
      });
    }
  }, [user]);

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

  if (posthogAPIKey && posthogHost) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }
  return <>{children}</>;
};

export default PosthogWrapper;
