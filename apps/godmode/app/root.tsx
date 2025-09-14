import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, type MetaFunction } from "react-router";
import type { Route } from "./+types/root";
import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import { ToastWithTheme } from "./toast.provider";
import { StoreProvider } from "./store.provider";
import { InstanceProvider } from "./instance.provider";
import { UserProvider } from "./user.provider";

export const meta: MetaFunction = () => {
  return [
    {
      title: "Plane | Simple, extensible, open-source project management tool.",
    },
    {
      name: "description",
      content:
        "Open-source project management tool to manage work items, sprints, and product roadmaps with peace of mind.",
    },
    {
      name: "openGraph:title",
      content: "Plane | Simple, extensible, open-source project management tool.",
    },
    {
      name: "openGraph:description",
      content:
        "Open-source project management tool to manage work items, sprints, and product roadmaps with peace of mind.",
    },
    { name: "openGraph:url", content: "https://plane.so/" },
    {
      name: "keywords",
      content:
        "software development, customer feedback, software, accelerate, code management, release management, project management, work items tracking, agile, scrum, kanban, collaboration",
    },
    { name: "twitter:site", content: "@planepowers" },
    {
      name: "twitter:title",
      content: "Plane | Simple, extensible, open-source project management tool.",
    },
    {
      name: "twitter:description",
      content:
        "Open-source project management tool to manage work items, sprints, and product roadmaps with peace of mind.",
    },
    { name: "twitter:url", content: "https://plane.so/" },
    { name: "twitter:image", content: "https://plane.so/og-image.png" },
    { name: "twitter:image:alt", content: "Plane - Modern project management" },
    { name: "twitter:image:width", content: "1200" },
    { name: "twitter:image:height", content: "630" },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" sizes="180x180" href={`/favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`/favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`/favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`/site.webmanifest.json`} />
        <link rel="shortcut icon" href={`/favicon/favicon.ico`} />
        <Meta />
        <Links />
      </head>
      <body className={`antialiased`}>
        {/* <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>

        </ThemeProvider> */}

        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

{
  /* <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
<ToastWithTheme />
<StoreProvider>
  <InstanceProvider>
    <UserProvider>{children}</UserProvider>
  </InstanceProvider>
</StoreProvider>
</ThemeProvider> */
}

export default function App() {
  return <Outlet />;
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
