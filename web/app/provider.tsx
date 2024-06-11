"use client";
import { FC, ReactNode } from "react";
import dynamic from "next/dynamic";
import { AppProgressBar } from "next-nprogress-bar";
import { useTheme, ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
// ui
import { Toast } from "@plane/ui";
// constants
import { SWR_CONFIG } from "@/constants/swr-config";
//helpers
import { resolveGeneralTheme } from "@/helpers/theme.helper";
// mobx store provider
import { StoreProvider } from "@/lib/store-context";
// wrappers
import { InstanceWrapper } from "@/lib/wrappers";
// dynamic imports
const StoreWrapper = dynamic(() => import("@/lib/wrappers/store-wrapper"), { ssr: false });
const PostHogProvider = dynamic(() => import("@/lib/posthog-provider"), { ssr: false });
const CrispWrapper = dynamic(() => import("@/lib/wrappers/crisp-wrapper"), { ssr: false });

export interface IAppProvider {
  children: ReactNode;
}

export const AppProvider: FC<IAppProvider> = (props) => {
  const { children } = props;
  // themes
  const { resolvedTheme } = useTheme();
  return (
    <>
      <AppProgressBar height="4px" color="#3F76FF" options={{ showSpinner: false }} shallowRouting />
      <Toast theme={resolveGeneralTheme(resolvedTheme)} />
      <StoreProvider>
        <ThemeProvider themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]} defaultTheme="system">
          <InstanceWrapper>
            <StoreWrapper>
              <CrispWrapper>
                <PostHogProvider>
                  <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>
                </PostHogProvider>
              </CrispWrapper>
            </StoreWrapper>
          </InstanceWrapper>
        </ThemeProvider>
      </StoreProvider>
    </>
  );
};
