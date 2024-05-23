"use client";

import { ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { SWRConfig } from "swr";
// ui
import { Toast } from "@plane/ui";
// constants
import { SWR_CONFIG } from "@/constants/swr-config";
// helpers
import { ASSET_PREFIX, resolveGeneralTheme } from "@/helpers/common.helper";
// lib
import { InstanceProvider } from "@/lib/instance-provider";
import { StoreProvider } from "@/lib/store-provider";
import { UserProvider } from "@/lib/user-provider";
// styles
import "./globals.css";

function RootLayout({ children }: { children: ReactNode }) {
  // themes
  const { resolvedTheme } = useTheme();

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
          <Toast theme={resolveGeneralTheme(resolvedTheme)} />
          <SWRConfig value={SWR_CONFIG}>
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

export default RootLayout;
