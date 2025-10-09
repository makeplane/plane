"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { InstanceProvider } from "./(all)/instance.provider";
import { StoreProvider } from "./(all)/store.provider";
import { ToastWithTheme } from "./(all)/toast";
import { UserProvider } from "./(all)/user.provider";

const DEFAULT_SWR_CONFIG = {
  refreshWhenHidden: false,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnMount: true,
  refreshInterval: 600_000,
  errorRetryCount: 3,
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
      <ToastWithTheme />
      <SWRConfig value={DEFAULT_SWR_CONFIG}>
        <StoreProvider>
          <InstanceProvider>
            <UserProvider>{children}</UserProvider>
          </InstanceProvider>
        </StoreProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
