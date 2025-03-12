"use client";

import { FC, ReactNode, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTheme, ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { usePathname, useRouter } from "next/navigation";
// ui
import { Toast } from "@plane/ui";
// constants
import { SWR_CONFIG } from "@/constants/swr-config";
//helpers
import { resolveGeneralTheme } from "@/helpers/theme.helper";
// nprogress
import { AppProgressBar } from "@/lib/n-progress";
// polyfills
import "@/lib/polyfills";
// mobx store provider
import { StoreProvider } from "@/lib/store-context";
// wrappers
import { InstanceWrapper } from "@/lib/wrappers";
// dynamic imports
const StoreWrapper = dynamic(() => import("@/lib/wrappers/store-wrapper"), { ssr: false });
const PostHogProvider = dynamic(() => import("@/lib/posthog-provider"), { ssr: false });
const IntercomProvider = dynamic(() => import("@/lib/intercom-provider"), { ssr: false });

export interface IAppProvider {
  children: ReactNode;
}

const ToastWithTheme = () => {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
};

export const AppProvider: FC<IAppProvider> = (props) => {
  const { children } = props;
  // themes

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // const onIncomingMessage = (event) => {
    //   console.log('onIncomingMessage', event);
    //   if (event.data.type === 'ROUTE_CHANGE') {
    //     console.log(location.pathname, event.data.path);
    //     router.replace(event.data.path);
    //   }
    // };
    console.log(pathname, 'pathname');
    window.parent.postMessage({ type: "ROUTE_CHANGE", path: pathname }, "*");
    // window.addEventListener('message', onIncomingMessage);
    // return () => {
    //   window.removeEventListener("message", onIncomingMessage);
    // };
  }, [pathname]);

  return (
    <>
      <AppProgressBar height="4px" color="#3F76FF" options={{ showSpinner: false }} shallowRouting />
      <StoreProvider>
        <ThemeProvider themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]} defaultTheme="system">
          <ToastWithTheme />
          <StoreWrapper>
            <InstanceWrapper>
              <IntercomProvider>
                <PostHogProvider>
                  <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>
                </PostHogProvider>
              </IntercomProvider>
            </InstanceWrapper>
          </StoreWrapper>
        </ThemeProvider>
      </StoreProvider>
    </>
  );
};
