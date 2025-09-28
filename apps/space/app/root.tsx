import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
// import { AppProvider } from "./provider";

const SPACE_BASE_PATH = import.meta.env.SPACE_BASE_PATH || "/spaces";

export function meta({}: Route.MetaFunction) {
  return [
    { title: "Plane Publish | Make your Plane boards public with one-click" },
    { name: "description", content: "Plane Publish is a customer feedback management tool built on top of plane.so" },
    {
      name: "keywords",
      content:
        "software development, customer feedback, software, accelerate, code management, release management, project management, work item tracking, agile, scrum, kanban, collaboration",
    },
    { name: "twitter:site", content: "@planepowers" },
    { name: "og:title", content: "Plane Publish | Make your Plane boards public with one-click" },
    {
      name: "og:description",
      content: "Plane Publish is a customer feedback management tool built on top of plane.so",
    },
    { name: "og:url", content: `https://sites.plane.so/` },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${SPACE_BASE_PATH}/favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${SPACE_BASE_PATH}/favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${SPACE_BASE_PATH}/favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`${SPACE_BASE_PATH}/site.webmanifest.json`} />
        <link rel="shortcut icon" href={`${SPACE_BASE_PATH}/favicon/favicon.ico`} />
        <meta name="robots" content="noindex, nofollow" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div id="editor-portal">
      {/* <AppProvider> */}
      <Outlet />
      {/* </AppProvider> */}
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
