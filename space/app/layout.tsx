import { Metadata } from "next";
// styles
import "@/styles/globals.css";
// components
import { InstanceNotReady, InstanceFailureView } from "@/components/instance";
// helpers
import { ASSET_PREFIX } from "@/helpers/common.helper";
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
  const instanceDetails = await instanceService.getInstanceInfo().catch(() => undefined);

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${ASSET_PREFIX}/favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${ASSET_PREFIX}/favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${ASSET_PREFIX}/favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`${ASSET_PREFIX}/site.webmanifest.json`} />
        <link rel="shortcut icon" href={`${ASSET_PREFIX}/favicon/favicon.ico`} />
      </head>
      <body>
        <AppProvider initialState={{ instance: instanceDetails }}>
          {!instanceDetails ? (
            <InstanceFailureView />
          ) : (
            <>
              {instanceDetails.instance.is_setup_done ? (
                <>{children}</>
              ) : (
                <div className="h-screen w-screen">
                  <InstanceNotReady />
                </div>
              )}
            </>
          )}
        </AppProvider>
      </body>
    </html>
  );
}
