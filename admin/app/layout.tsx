"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
// lib
import { StoreProvider } from "@/lib/store-context";
import { AppWrapper } from "@/lib/wrappers";
// constants
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, TWITTER_USER_NAME, SITE_KEYWORDS, SITE_TITLE } from "@/constants/seo";
// helpers
import { ASSET_PREFIX } from "@/helpers/common.helper";
// styles
import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children, ...pageProps }: RootLayoutProps) => (
  <html lang="en">
    <head>
      <title>{SITE_TITLE}</title>
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={SITE_TITLE} />
      <meta property="og:url" content={SITE_URL} />
      <meta name="description" content={SITE_DESCRIPTION} />
      <meta property="og:description" content={SITE_DESCRIPTION} />
      <meta name="keywords" content={SITE_KEYWORDS} />
      <meta name="twitter:site" content={`@${TWITTER_USER_NAME}`} />
      <link rel="apple-touch-icon" sizes="180x180" href={`${ASSET_PREFIX}/favicon/apple-touch-icon.png`} />
      <link rel="icon" type="image/png" sizes="32x32" href={`${ASSET_PREFIX}/favicon/favicon-32x32.png`} />
      <link rel="icon" type="image/png" sizes="16x16" href={`${ASSET_PREFIX}/favicon/favicon-16x16.png`} />
      <link rel="manifest" href={`${ASSET_PREFIX}/site.webmanifest.json`} />
      <link rel="shortcut icon" href={`${ASSET_PREFIX}/favicon/favicon.ico`} />
    </head>
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
