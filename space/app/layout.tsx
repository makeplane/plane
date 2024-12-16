import { Metadata } from "next";
// helpers
import { SPACE_BASE_PATH } from "@plane/constants";
// styles
import "@/styles/globals.css";
// components
import { AppProvider } from "./provider";

export const metadata: Metadata = {
  title: "Plane Publish | Make your Plane boards public with one-click",
  description: "Plane Publish is a customer feedback management tool built on top of plane.so",
  openGraph: {
    title: "Plane Publish | Make your Plane boards public with one-click",
    description: "Plane Publish is a customer feedback management tool built on top of plane.so",
    url: "https://sites.plane.so/",
  },
  keywords:
    "software development, customer feedback, software, accelerate, code management, release management, project management, issue tracking, agile, scrum, kanban, collaboration",
  twitter: {
    site: "@planepowers",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${SPACE_BASE_PATH}/favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${SPACE_BASE_PATH}/favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${SPACE_BASE_PATH}/favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`${SPACE_BASE_PATH}/site.webmanifest.json`} />
        <link rel="shortcut icon" href={`${SPACE_BASE_PATH}/favicon/favicon.ico`} />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
