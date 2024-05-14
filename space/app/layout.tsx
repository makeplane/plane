import { Metadata } from "next";
// styles
import "@/styles/globals.css";
// components
import { InstanceNotReady } from "@/components/instance";
// lib
import { AppProvider } from "@/lib/app-providers";
// services
import { InstanceService } from "@/services/instance.service";

const instanceService = new InstanceService();

export const metadata: Metadata = {
  title: "Plane Deploy | Make your Plane boards public with one-click",
  description: "Plane Deploy is a customer feedback management tool built on top of plane.so",
  openGraph: {
    title: "Plane Deploy | Make your Plane boards public with one-click",
    description: "Plane Deploy is a customer feedback management tool built on top of plane.so",
    url: "https://sites.plane.so/",
  },
  keywords:
    "software development, customer feedback, software, accelerate, code management, release management, project management, issue tracking, agile, scrum, kanban, collaboration",
  twitter: {
    site: "@planepowers",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const instanceDetails = await instanceService.getInstanceInfo();

  return (
    <html lang="en">
      <head>
        {/* <link rel="apple-touch-icon" sizes="180x180" href={`${prefix}favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${prefix}favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${prefix}favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`${prefix}site.webmanifest.json`} />
        <link rel="shortcut icon" href={`${prefix}favicon/favicon.ico`} /> */}
      </head>
      <body>
        {!instanceDetails?.instance?.is_setup_done ? (
          <InstanceNotReady />
        ) : (
          <AppProvider initialState={{ instance: instanceDetails.instance }}>{children}</AppProvider>
        )}
      </body>
    </html>
  );
}
