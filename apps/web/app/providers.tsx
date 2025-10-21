"use client";

import { useTheme, ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { WEB_SWR_CONFIG } from "@plane/constants";
import { TranslationProvider } from "@plane/i18n";
import { Toast } from "@plane/propel/toast";
import { resolveGeneralTheme } from "@plane/utils";
import { StoreProvider } from "@/lib/store-context";
import { InstanceWrapper } from "@/lib/wrappers/instance-wrapper";
import StoreWrapper from "@/lib/wrappers/store-wrapper";
import PostHogProvider from "@/lib/posthog-provider";
import IntercomProvider from "@/lib/intercom-provider";

const ToastWithTheme = () => {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
