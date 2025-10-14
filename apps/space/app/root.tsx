import { Links, Meta, Outlet, Scripts } from "react-router";
import type { LinksFunction } from "react-router";
// styles
import "@/styles/globals.css";
// assets
import appleTouchIcon from "@/app/assets/favicon/apple-touch-icon.png?url";
import favicon16 from "@/app/assets/favicon/favicon-16x16.png?url";
import favicon32 from "@/app/assets/favicon/favicon-32x32.png?url";
import faviconIco from "@/app/assets/favicon/favicon.ico?url";
// types
import type { Route } from "./+types/root";
// local imports
import ErrorPage from "./error";
import { AppProviders } from "./providers";

const APP_TITLE = "Plane Publish | Make your Plane boards public with one-click";
const APP_DESCRIPTION = "Plane Publish is a customer feedback management tool built on top of plane.so";

export const links: LinksFunction = () => [
  { rel: "apple-touch-icon", sizes: "180x180", href: appleTouchIcon },
  { rel: "icon", type: "image/png", sizes: "32x32", href: favicon32 },
  { rel: "icon", type: "image/png", sizes: "16x16", href: favicon16 },
  { rel: "shortcut icon", href: faviconIco },
  { rel: "manifest", href: `/site.webmanifest.json` },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <Meta />
        <Links />
      </head>
      <body>
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

export function ErrorBoundary() {
  return <ErrorPage />;
}
