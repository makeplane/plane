import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts } from "react-router";
import type { LinksFunction } from "react-router";
import * as Sentry from "@sentry/react-router";
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

  return (
    <div>
      <p>Something went wrong.</p>
    </div>
  );
}
