import { ReactNode } from "react";
import { Metadata } from "next";
// components
import { InstanceFailureView, InstanceSetupForm } from "@/components/instance";
// helpers
import { ASSET_PREFIX } from "@/helpers/common.helper";
// layout
import { DefaultLayout } from "@/layouts/default-layout";
// lib
import { AppProvider } from "@/lib/app-providers";
// styles
import "./globals.css";
// services
import { InstanceService } from "@/services/instance.service";

const instanceService = new InstanceService();

export const metadata: Metadata = {
  title: "Plane | Simple, extensible, open-source project management tool.",
  description:
    "Open-source project management tool to manage issues, sprints, and product roadmaps with peace of mind.",
  openGraph: {
    title: "Plane | Simple, extensible, open-source project management tool.",
    description:
      "Open-source project management tool to manage issues, sprints, and product roadmaps with peace of mind.",
    url: "https://plane.so/",
  },
  keywords:
    "software development, customer feedback, software, accelerate, code management, release management, project management, issue tracking, agile, scrum, kanban, collaboration",
  twitter: {
    site: "@planepowers",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const instanceDetails = await instanceService.getInstanceInfo().catch(() => null);

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${ASSET_PREFIX}/favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${ASSET_PREFIX}/favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${ASSET_PREFIX}/favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`${ASSET_PREFIX}/site.webmanifest.json`} />
        <link rel="shortcut icon" href={`${ASSET_PREFIX}/favicon/favicon.ico`} />
      </head>
      <body className={`antialiased`}>
        <AppProvider initialState={{ instance: instanceDetails }}>
          {instanceDetails ? (
            <>
              {instanceDetails?.instance?.is_setup_done ? (
                <>{children}</>
              ) : (
                <DefaultLayout>
                  <div className="relative w-screen min-h-screen overflow-y-auto px-5 py-10 mx-auto flex justify-center items-center">
                    <InstanceSetupForm />
                  </div>
                </DefaultLayout>
              )}
            </>
          ) : (
            <DefaultLayout>
              <div className="relative w-screen min-h-[500px] overflow-y-auto px-5 mx-auto flex justify-center items-center">
                <InstanceFailureView />
              </div>
            </DefaultLayout>
          )}
        </AppProvider>
      </body>
    </html>
  );
}
