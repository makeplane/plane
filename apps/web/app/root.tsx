import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Links, Meta, Outlet, Scripts } from "react-router";
import type { LinksFunction } from "react-router";
import "../styles/globals.css";
import appleTouchIcon from "@/app/assets/favicon/apple-touch-icon.png?url";
import favicon16 from "@/app/assets/favicon/favicon-16x16.png?url";
import favicon32 from "@/app/assets/favicon/favicon-32x32.png?url";
import faviconIco from "@/app/assets/favicon/favicon.ico?url";
import type { Route } from "./+types/root";
import { AppProvider } from "./provider";

const APP_TITLE = "Plane Web";
const APP_DESCRIPTION = "Plane web app migrated to React Router.";

export const links: LinksFunction = () => [
  { rel: "apple-touch-icon", sizes: "180x180", href: appleTouchIcon },
  { rel: "icon", type: "image/png", sizes: "32x32", href: favicon32 },
  { rel: "icon", type: "image/png", sizes: "16x16", href: favicon16 },
  { rel: "shortcut icon", href: faviconIco },
  { rel: "manifest", href: `/site.webmanifest.json` },
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
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export const meta: Route.MetaFunction = () => [{ title: APP_TITLE }, { name: "description", content: APP_DESCRIPTION }];

export default function Root() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return (
    <div>
      <p>Something went wrong.</p>
    </div>
  );
}

export function HydrateFallback() {
  return null;
}
