import type { ReactNode } from "react";
import type { Metadata } from "next";
// plane imports
import { ADMIN_BASE_PATH } from "@plane/constants";
// styles
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Plane | Simple, extensible, open-source project management tool.",
  description:
    "Open-source project management tool to manage work items, sprints, and product roadmaps with peace of mind.",
  openGraph: {
    title: "Plane | Simple, extensible, open-source project management tool.",
    description:
      "Open-source project management tool to manage work items, sprints, and product roadmaps with peace of mind.",
    url: "https://plane.so/",
  },
  keywords:
    "software development, customer feedback, software, accelerate, code management, release management, project management, work items tracking, agile, scrum, kanban, collaboration",
  twitter: {
    site: "@planepowers",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const ASSET_PREFIX = ADMIN_BASE_PATH;
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${ASSET_PREFIX}/favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${ASSET_PREFIX}/favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${ASSET_PREFIX}/favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`${ASSET_PREFIX}/site.webmanifest.json`} />
        <link rel="shortcut icon" href={`${ASSET_PREFIX}/favicon/favicon.ico`} />
      </head>
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
