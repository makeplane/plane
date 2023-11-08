import { FC, ReactNode, useEffect } from "react";
import dynamic from "next/dynamic";
import Router, { useRouter } from "next/router";
import { ThemeProvider } from "next-themes";
import NProgress from "nprogress";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
// mobx store provider
import { MobxStoreProvider, useMobxStore } from "lib/mobx/store-provider";
import MobxStoreInit from "lib/mobx/store-init";
// constants
import { THEMES } from "constants/themes";
// contexts
import { ToastContextProvider } from "contexts/toast.context";
import useUser from "hooks/use-user";
import { observer } from "mobx-react-lite";

const CrispWithNoSSR = dynamic(() => import("constants/crisp"), { ssr: false });

// nprogress
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", NProgress.start);
Router.events.on("routeChangeError", NProgress.done);
Router.events.on("routeChangeComplete", NProgress.done);

// Check that PostHog is client-side (used to handle Next.js SSR)
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    // Enable debug mode in development
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
    autocapture: false,
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
  });
}

export interface IAppProvider {
  children: ReactNode;
}

const AppProviders: FC<IAppProvider> = observer((props) => {
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
  }, []);

  if (envConfig && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }
  return <>{children}</>;
});

export default AppProviders;
