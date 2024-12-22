"use client";

import { ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { SWRConfig } from "swr";
// ui
import { ADMIN_BASE_PATH, DEFAULT_SWR_CONFIG } from "@plane/constants";
import { Toast } from "@plane/ui";
import { resolveGeneralTheme } from "@plane/utils";
// constants
// helpers
// lib
import { InstanceProvider } from "@/lib/instance-provider";
import { StoreProvider } from "@/lib/store-provider";
import { UserProvider } from "@/lib/user-provider";
// styles
import "./globals.css";

const ToastWithTheme = () => {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const ASSET_PREFIX = ADMIN_BASE_PATH;
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${ASSET_PREFIX}/favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${ASSET_PREFIX}/favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${ASSET_PREFIX}/favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`${ASSET_PREFIX}/site.webmanifest.json`} />
        <link rel="shortcut icon" href={`${ASSET_PREFIX}/favicon/favicon.ico`} />
      </head>
      <body className={`antialiased`}>
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
      </body>
    </html>
  );
}
