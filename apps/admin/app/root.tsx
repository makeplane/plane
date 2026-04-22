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

import { useContext } from "react";
import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts } from "react-router";
import { ThemeScript } from "@plane/react-theme";
import type { LinksFunction } from "react-router";
import * as Sentry from "@sentry/react-router";
import { Button } from "@plane/propel/button";
import { StoreContext } from "@/providers/store.provider";
import appleTouchIcon from "@/app/assets/favicon/apple-touch-icon.png?url";
import favicon16 from "@/app/assets/favicon/favicon-16x16.png?url";
import favicon32 from "@/app/assets/favicon/favicon-32x32.png?url";
import faviconIco from "@/app/assets/favicon/favicon.ico?url";
import { LogoSpinner } from "@/components/common/logo-spinner";
import globalStyles from "@/styles/globals.css?url";
import { AppProviders } from "@/providers";
import type { Route } from "./+types/root";
// fonts
import "@fontsource-variable/inter";
import interVariableWoff2 from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import "@fontsource/material-symbols-rounded";
import "@fontsource/ibm-plex-mono";

const CRITICAL_THEME_CSS = `html{background:oklch(0.9543 0.001 230.67)}html[data-theme*="dark"]{background:oklch(0.1689 0.0021 230.81)}body{margin:0}.logo-spinner-light,.logo-spinner-dark{height:1.5rem;width:auto;object-fit:contain}@media(min-width:640px){.logo-spinner-light,.logo-spinner-dark{height:2.75rem}}.logo-spinner-dark{display:none}html[data-theme*="dark"] .logo-spinner-light{display:none}html[data-theme*="dark"] .logo-spinner-dark{display:block}`;

const APP_TITLE = "Plane | Simple, extensible, open-source project management tool.";
const APP_DESCRIPTION =
  "Open-source project management tool to manage work items, sprints, and product roadmaps with peace of mind.";

export const links: LinksFunction = () => [
  { rel: "apple-touch-icon", sizes: "180x180", href: appleTouchIcon },
  { rel: "icon", type: "image/png", sizes: "32x32", href: favicon32 },
  { rel: "icon", type: "image/png", sizes: "16x16", href: favicon16 },
  { rel: "shortcut icon", href: faviconIco },
  { rel: "manifest", href: `/site.webmanifest.json` },
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ThemeScript />
        <style id="critical-theme" dangerouslySetInnerHTML={{ __html: CRITICAL_THEME_CSS }} />
        <meta name="theme-color" content="#eff0f0" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased" suppressHydrationWarning>
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
  { property: "og:url", content: "https://plane.so/" },
  {
    name: "keywords",
    content:
      "software development, customer feedback, software, accelerate, code management, release management, project management, work items tracking, agile, scrum, kanban, collaboration",
  },
  { name: "twitter:site", content: "@planepowers" },
];

export default function Root() {
  return (
    <div className="bg-canvas min-h-screen">
      <Outlet />
    </div>
  );
}

export function HydrateFallback() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center">
      <LogoSpinner />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (error) {
    Sentry.captureException(error);
  }

  const store = useContext(StoreContext);
  const isSelfManaged = store?.instance?.config?.is_self_managed ?? true;

  return (
    <div className="bg-surface-1 grid h-screen place-items-center p-4">
      <div className="space-y-8 text-center">
        <div className="space-y-2">
          <h3 className="text-16 font-semibold">Something went wrong{isSelfManaged ? "" : "."}</h3>
          <p className="mx-auto md:w-1/2 text-13 text-secondary">
            We{"'"}ve encountered an unexpected error
            {!isSelfManaged && " and our team has been automatically notified"}. Please try reloading the page. If this
            issue persists, reach out to{" "}
            <a href="mailto:support@plane.so" className="text-accent-primary">
              support@plane.so
            </a>{" "}
            or visit our{" "}
            <a href="https://forum.plane.so" target="_blank" rel="noopener noreferrer" className="text-accent-primary">
              community forum
            </a>{" "}
            for assistance.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}
