"use client";

import type { FC, ReactNode } from "react";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import dynamic from "next/dynamic";
import { useTheme, ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
// Plane Imports
import { WEB_SWR_CONFIG } from "@plane/constants";
import { TranslationProvider } from "@plane/i18n";
import { Toast } from "@plane/propel/toast";
//helpers
import { resolveGeneralTheme } from "@plane/utils";
// polyfills
import "@/lib/polyfills";
// mobx store provider
import { StoreProvider } from "@/lib/store-context";
// wrappers
import { InstanceWrapper } from "@/lib/wrappers/instance-wrapper";
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
  return (
    <>
      <ProgressProvider
        height="4px"
        color="rgb(var(--color-primary-100))"
        options={{ showSpinner: false }}
        shallowRouting
      >
        <StoreProvider>
          <ThemeProvider themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]} defaultTheme="system">
            <TranslationProvider>
              <ToastWithTheme />
              <StoreWrapper>
                <InstanceWrapper>
                  <IntercomProvider>
                    <PostHogProvider>
                      <SWRConfig value={WEB_SWR_CONFIG}>{children}</SWRConfig>
                    </PostHogProvider>
                  </IntercomProvider>
                </InstanceWrapper>
              </StoreWrapper>
            </TranslationProvider>
          </ThemeProvider>
        </StoreProvider>
      </ProgressProvider>
    </>
  );
};
