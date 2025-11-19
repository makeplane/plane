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
// progress bar
import { AppProgressBar } from "@/lib/b-progress";
// mobx store provider
import { StoreProvider } from "@/lib/store-context";
// wrappers
import { InstanceWrapper } from "@/lib/wrappers/instance-wrapper";

// lazy imports
const StoreWrapper = lazy(function StoreWrapper() {
  return import("@/lib/wrappers/store-wrapper");
});

const PostHogProvider = lazy(function PostHogProvider() {
  return import("@/lib/posthog-provider");
});

const IntercomProvider = lazy(function IntercomProvider() {
  return import("@/lib/intercom-provider");
});

export interface IAppProvider {
  children: ReactNode;
}

function ToastWithTheme() {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
}

export function AppProvider(props: IAppProvider) {
  const { children } = props;
  // themes
  return (
    <StoreProvider>
      <ThemeProvider themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]} defaultTheme="system">
        <AppProgressBar />
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
}
