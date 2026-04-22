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

import { ThemeScript } from "@plane/react-theme";
import * as Sentry from "@sentry/react-router";
import { Links, Meta, Outlet, Scripts } from "react-router";
// assets
import appleTouchIcon from "@/app/assets/favicon/apple-touch-icon.png?url";
import favicon16 from "@/app/assets/favicon/favicon-16x16.png?url";
import favicon32 from "@/app/assets/favicon/favicon-32x32.png?url";
import faviconIco from "@/app/assets/favicon/favicon.ico?url";
import siteWebmanifest from "@/app/assets/favicon/site.webmanifest?url";
import { LogoSpinner } from "@/components/common/logo-spinner";
import globalStyles from "@/styles/globals.css?url";

const CRITICAL_THEME_CSS = `html{background:oklch(0.9543 0.001 230.67)}html[data-theme*="dark"]{background:oklch(0.1689 0.0021 230.81)}body{margin:0}.logo-spinner-light,.logo-spinner-dark{height:1.5rem;width:auto;object-fit:contain}@media(min-width:640px){.logo-spinner-light,.logo-spinner-dark{height:2.75rem}}.logo-spinner-dark{display:none}html[data-theme*="dark"] .logo-spinner-light{display:none}html[data-theme*="dark"] .logo-spinner-dark{display:block}`;
// types
import type { Route } from "./+types/root";
// local imports
import ErrorPage from "./error";
import { AppProviders } from "./providers";
// fonts
import "@fontsource-variable/inter";
import interVariableWoff2 from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import "@fontsource/material-symbols-rounded";
import "@fontsource/ibm-plex-mono";

const APP_TITLE = "Plane Publish | Make your Plane boards public with one-click";
const APP_DESCRIPTION = "Plane Publish is a customer feedback management tool built on top of plane.so";

export const links: Route.LinksFunction = () => [
  { rel: "apple-touch-icon", sizes: "180x180", href: appleTouchIcon },
  { rel: "icon", type: "image/png", sizes: "32x32", href: favicon32 },
  { rel: "icon", type: "image/png", sizes: "16x16", href: favicon16 },
  { rel: "shortcut icon", href: faviconIco },
  { rel: "manifest", href: siteWebmanifest },
  { rel: "stylesheet", href: globalStyles },
  {
    rel: "preload",
    href: interVariableWoff2,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export const headers: Route.HeadersFunction = () => ({
  "Referrer-Policy": "origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
});

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ThemeScript />
        <style id="critical-theme" dangerouslySetInnerHTML={{ __html: CRITICAL_THEME_CSS }} />
        <meta name="theme-color" content="#eff0f0" />
        <meta name="robots" content="noindex, nofollow" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <div id="editor-portal" />
        <AppProviders>{children}</AppProviders>
        <Scripts />
      </body>
    </html>
  );
}

export const meta: Route.MetaFunction = () => [
  { title: APP_TITLE },
  { name: "description", content: APP_DESCRIPTION },
  { property: "og:title", content: APP_TITLE },
  { property: "og:description", content: APP_DESCRIPTION },
  { property: "og:url", content: "https://sites.plane.so/" },
  {
    name: "keywords",
    content:
      "software development, customer feedback, software, accelerate, code management, release management, project management, work item tracking, agile, scrum, kanban, collaboration",
  },
  { name: "twitter:site", content: "@planepowers" },
];

export default function Root() {
  return <Outlet />;
}

export function HydrateFallback() {
  return (
    <div className="bg-surface-1 relative flex h-screen w-full items-center justify-center">
      <LogoSpinner />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (error) {
    Sentry.captureException(error);
  }

  return <ErrorPage />;
}
