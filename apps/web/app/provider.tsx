"use client";

import type { FC, ReactNode } from "react";
import { lazy, Suspense } from "react";
import { useTheme, ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
// Plane Imports
import { WEB_SWR_CONFIG } from "@plane/constants";
import { TranslationProvider } from "@plane/i18n";
import { Toast } from "@plane/propel/toast";
// helpers
import { resolveGeneralTheme } from "@plane/utils";
// polyfills
import "@/lib/polyfills";
// mobx store provider
import { StoreProvider } from "@/lib/store-context";
// wrappers
import { InstanceWrapper } from "@/lib/wrappers/instance-wrapper";
// lazy imports
const StoreWrapper = lazy(() => import("@/lib/wrappers/store-wrapper"));
const PostHogProvider = lazy(() => import("@/lib/posthog-provider"));
const IntercomProvider = lazy(() => import("@/lib/intercom-provider"));

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
    <StoreProvider>
      <ThemeProvider themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]} defaultTheme="system">
        <TranslationProvider>
          <ToastWithTheme />
          <StoreWrapper>
            <InstanceWrapper>
              <Suspense>
                <IntercomProvider>
                  <PostHogProvider>
                    <SWRConfig value={WEB_SWR_CONFIG}>{children}</SWRConfig>
                  </PostHogProvider>
                </IntercomProvider>
              </Suspense>
            </InstanceWrapper>
          </StoreWrapper>
        </TranslationProvider>
      </ThemeProvider>
    </StoreProvider>
  );
};
