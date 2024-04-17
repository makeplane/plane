"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
// lib
import { StoreProvider } from "@/lib/store-context";
import { AppWrapper, InstanceWrapper, AuthWrapper } from "@/lib/wrappers";
// styles
import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

export const RootLayout = async ({ children, ...pageProps }: RootLayoutProps) => (
  <html lang="en">
    <body className={`antialiased`}>
      <StoreProvider {...pageProps}>
        <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
          <AppWrapper>
            <InstanceWrapper>
              <AuthWrapper>{children}</AuthWrapper>
            </InstanceWrapper>
          </AppWrapper>
        </ThemeProvider>
      </StoreProvider>
    </body>
  </html>
);

export default RootLayout;
