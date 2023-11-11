import { FC, ReactNode, useEffect } from "react";
import dynamic from "next/dynamic";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import posthog from "posthog-js";
import { observer } from "mobx-react-lite";
// mobx store provider
import { useMobxStore } from "lib/mobx/store-provider";

const StoreWrapper = dynamic(() => import("lib/wrappers/store-wrapper"), { ssr: false });
const PosthogWrapper = dynamic(() => import("lib/wrappers/posthog-wrapper"), { ssr: false });
const CrispWrapper = dynamic(() => import("lib/wrappers/crisp-wrapper"), { ssr: false });

// nprogress
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", NProgress.start);
Router.events.on("routeChangeError", NProgress.done);
Router.events.on("routeChangeComplete", NProgress.done);

export interface IAppProvider {
  children: ReactNode;
}

// Check that PostHog is client-side (used to handle Next.js SSR)
if (typeof window !== "undefined") {
}

export const AppProvider: FC<IAppProvider> = observer((props) => {
  const { children } = props;
  // router
  const router = useRouter();
  // store
  const {
    user: { currentUser },
    appConfig: { envConfig },
  } = useMobxStore();

  useEffect(() => {
    if (currentUser) {
      // Identify sends an event, so you want may want to limit how often you call it
      posthog?.identify(currentUser.email, {
        email: currentUser.email,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        id: currentUser.id,
      });
    }
  }, [currentUser]);

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

  return (
    <StoreWrapper>
      <CrispWrapper user={currentUser}>
        <PosthogWrapper
          user={currentUser}
          posthogAPIKey={envConfig?.posthog_api_key || null}
          posthogHost={envConfig?.posthog_host || null}
        >
          {children}
        </PosthogWrapper>
      </CrispWrapper>
    </StoreWrapper>
  );
});
