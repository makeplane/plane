/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as Sentry from "@sentry/react-router";
import { Links, Meta, Outlet, Scripts } from "react-router";
import type { LinksFunction } from "react-router";
import { ThemeProvider } from "next-themes";
// plane imports
import { SITE_DESCRIPTION, SITE_NAME, IOS_APP_ID } from "@plane/constants";
import { cn } from "@plane/utils";
// types
// assets
import favicon16 from "@/app/assets/favicon/favicon-16x16.png?url";
import favicon32 from "@/app/assets/favicon/favicon-32x32.png?url";
import faviconIco from "@/app/assets/favicon/favicon.ico?url";
import icon180 from "@/app/assets/icons/icon-180x180.png?url";
import icon512 from "@/app/assets/icons/icon-512x512.png?url";
import ogImage from "@/app/assets/og-image.png?url";
import clarityTrackingScript from "@/app/assets/runtime/clarity-tracking.js?url";
import globalStyles from "@/styles/globals.css?url";
import type { Route } from "./+types/root";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { GetMobileApp } from "@/components/mobile";
// plane web imports
import { TrialBanner } from "@/components/workspace/license/banner/trial-banner";
import { bootstrapInstance } from "@/lib/bootstrap/client-bootstrap";
// store
import { store } from "@/lib/store-context";
// local
import { CustomErrorComponent } from "./error";
import { AppProvider } from "./provider";
// fonts
import "@fontsource-variable/inter";
import interVariableWoff2 from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import "@fontsource/material-symbols-rounded";
import "@fontsource/ibm-plex-mono";

const APP_TITLE = "Plane | Simple, extensible, open-source project management tool.";

// Inline theme initializer — runs synchronously in <head> before first paint.
// Reads "theme" from localStorage, resolves "system" via matchMedia, then sets
// data-theme on <html> + colorScheme + theme-color meta.
const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement,s=localStorage.getItem("theme")||"system",t=s==="system"?window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light":s;d.setAttribute("data-theme",t);d.style.colorScheme=t.includes("dark")?"dark":"light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t.includes("dark")?"#0e0f10":"#eff0f0")}catch(e){}})()`;

export const links: LinksFunction = () => [
  { rel: "icon", type: "image/png", sizes: "32x32", href: favicon32 },
  { rel: "icon", type: "image/png", sizes: "16x16", href: favicon16 },
  { rel: "shortcut icon", href: faviconIco },
  { rel: "manifest", href: "/site.webmanifest.json" },
  { rel: "apple-touch-icon", href: icon512 },
  { rel: "apple-touch-icon", sizes: "180x180", href: icon180 },
  { rel: "apple-touch-icon", sizes: "512x512", href: icon512 },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "stylesheet", href: globalStyles },
  {
    rel: "preload",
    href: interVariableWoff2,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export function Layout({ children }: { children: ReactNode }) {
  const isSessionRecorderEnabled = parseInt(process.env.VITE_ENABLE_SESSION_RECORDER || "0");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Critical inline CSS — sets html background before globals.css loads to prevent flash.
            Values must match packages/tailwind-config/variables.css:
            Light: --neutral-300 = oklch(0.9543 0.001 230.67)
            Dark: --neutral-black = oklch(0.1689 0.0021 230.81) */}
        <style
          id="theme-critical-css"
          dangerouslySetInnerHTML={{
            __html: `html{background:oklch(0.9543 0.001 230.67)}html[data-theme*="dark"]{background:oklch(0.1689 0.0021 230.81)}`,
          }}
        />
        <meta name="theme-color" content="#eff0f0" />
        {/* Meta info for PWA */}
        <meta name="application-name" content="Plane" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Meta info for ios smart banner */}
        <meta name="apple-itunes-app" content={`app-id=${IOS_APP_ID}`} />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <div id="context-menu-portal" />
        <div id="editor-portal" />
        {children}
        <Scripts />
        {!!isSessionRecorderEnabled && process.env.VITE_SESSION_RECORDER_KEY && (
          <script
            id="clarity-tracking"
            src={clarityTrackingScript}
            data-clarity-key={process.env.VITE_SESSION_RECORDER_KEY}
          />
        )}
      </body>
    </html>
  );
}

export const meta: Route.MetaFunction = () => [
  { title: APP_TITLE },
  { name: "description", content: SITE_DESCRIPTION },
  { property: "og:title", content: APP_TITLE },
  {
    property: "og:description",
    content: "Open-source project management tool to manage work items, cycles, and product roadmaps easily",
  },
  { property: "og:url", content: "https://app.plane.so/" },
  { property: "og:image", content: ogImage },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: "Plane - Modern project management" },
  {
    name: "keywords",
    content:
      "software development, plan, ship, software, accelerate, code management, release management, project management, work item tracking, agile, scrum, kanban, collaboration",
  },
  { name: "twitter:site", content: "@planepowers" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: ogImage },
  { name: "twitter:image:width", content: "1200" },
  { name: "twitter:image:height", content: "630" },
  { name: "twitter:image:alt", content: "Plane - Modern project management" },
];

const syncRouterParamsMiddleware: Route.ClientMiddlewareFunction = async ({ params }, next) => {
  // LEGACY COMPATIBILITY ONLY: This syncs route params to the deprecated router store.
  // Do not use router store for new route-context reads - use React Router params/loaders directly.
  store.router.setQuery({ ...params });
  await next();
};

export const clientMiddleware = [syncRouterParamsMiddleware];

export async function clientLoader() {
  await bootstrapInstance();
  return null;
}
clientLoader.hydrate = true as const;

export default function Root() {
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsContentVisible(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="data-theme"
      storageKey="theme"
      themes={["light", "dark", "light-contrast", "dark-contrast", "custom"]}
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
    >
      <AppProvider>
        <div
          className={cn(
            "h-screen w-full overflow-hidden bg-canvas relative flex flex-col transition-opacity duration-300 ease-out",
            isContentVisible ? "opacity-100" : "opacity-0",
            "desktop-app-container"
          )}
        >
          <GetMobileApp />
          {/* free trial banner */}
          <TrialBanner />
          <main className="w-full h-full overflow-hidden relative">
            <Outlet />
          </main>
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}

export function HydrateFallback() {
  return (
    <div className="relative flex bg-canvas h-screen w-full items-center justify-center">
      <LogoSpinner />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (error) {
    Sentry.captureException(error);
  }

  return <CustomErrorComponent error={error} />;
}
