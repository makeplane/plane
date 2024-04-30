"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
// lib
import { StoreProvider } from "@/lib/store-context";
import { AppWrapper } from "@/lib/wrappers";
// styles
import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children, ...pageProps }: RootLayoutProps) => (
  <html lang="en">
    <body className={`antialiased`}>
      <StoreProvider {...pageProps}>
        <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
          <AppWrapper>{children}</AppWrapper>
        </ThemeProvider>
      </StoreProvider>
    </body>
  </html>
);

export default RootLayout;
