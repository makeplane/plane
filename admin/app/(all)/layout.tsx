"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
// providers
import { InstanceProvider } from "./instance.provider";
import { StoreProvider } from "./store.provider";
import { ToastWithTheme } from "./toast";
import { UserProvider } from "./user.provider";

const DEFAULT_SWR_CONFIG = {
  refreshWhenHidden: false,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnMount: true,
  refreshInterval: 600000,
  errorRetryCount: 3,
};

export default function InstanceLayout({ children }: { children: React.ReactNode }) {
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
