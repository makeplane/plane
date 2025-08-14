"use client";

import { FC, ReactNode, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";//ui
import { useTheme, ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { TranslationProvider } from "@plane/i18n";
import { Toast, setToast, TOAST_TYPE } from "@plane/ui";
// Plane Imports
// constants
import { SWR_CONFIG } from "@/constants/swr-config";
//helpers
import { resolveGeneralTheme } from "@/helpers/theme.helper";
import { useUser } from "@/hooks/store";
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

  const pathname = usePathname();
  const { signOut } = useUser();

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to sign out. Please try again.",
      })
    );
  };

  useEffect(() => {
    console.log(pathname, 'pathname');
    window.parent.postMessage({ type: "ROUTE_CHANGE", path: pathname }, "*");
  }, [pathname]);

  useEffect(() => {
    const onIncomingMessage = async (event: MessageEvent) => {
      console.log('onIncomingMessage', event);
      if (event.data.type === "PLANE_SIGN_OUT") {
        try {
          await handleSignOut();
          window.parent.postMessage({ type: "PLANE_SIGN_OUT_SUCCESS", path: pathname }, "*");
        } catch (err) {}
      }
    };
    window.addEventListener('message', onIncomingMessage);
    return () => {
      window.removeEventListener("message", onIncomingMessage);
    };
  }, []);

  return (
    <>
      <AppProgressBar height="4px" color="#3F76FF" options={{ showSpinner: false }} shallowRouting />
      <StoreProvider>
        <ThemeProvider themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]} defaultTheme="system">
          <ToastWithTheme />
          <TranslationProvider>
            <StoreWrapper>
              <InstanceWrapper>
                <IntercomProvider>
                  <PostHogProvider>
                    <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>
                  </PostHogProvider>
                </IntercomProvider>
              </InstanceWrapper>
            </StoreWrapper>
          </TranslationProvider>
        </ThemeProvider>
      </StoreProvider>
    </>
  );
};