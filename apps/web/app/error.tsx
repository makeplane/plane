"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
// layouts
import { Button } from "@plane/propel/button";
import { useAppRouter } from "@/hooks/use-app-router";
import DefaultLayout from "@/layouts/default-layout";
// images
import maintenanceModeDarkModeImage from "@/public/instance/maintenance-mode-dark.svg";
import maintenanceModeLightModeImage from "@/public/instance/maintenance-mode-light.svg";

const linkMap = [
  {
    key: "mail_to",
    label: "Contact Support",
    value: "mailto:support@plane.so",
  },
  {
    key: "status",
    label: "Status Page",
    value: "https://status.plane.so/",
  },
  {
    key: "twitter_handle",
    label: "@planepowers",
    value: "https://x.com/planepowers",
  },
];

export default function CustomErrorComponent() {
  // hooks
  const { resolvedTheme } = useTheme();
  const router = useAppRouter();

  // derived values
  const maintenanceModeImage = resolvedTheme === "dark" ? maintenanceModeDarkModeImage : maintenanceModeLightModeImage;

  return (
    <DefaultLayout>
      <div className="relative container mx-auto h-full w-full max-w-xl flex flex-col gap-2 items-center justify-center gap-y-6 bg-custom-background-100 text-center px-6">
        <div className="relative w-full">
          <Image
            src={maintenanceModeImage}
            height="176"
            width="288"
            alt="ProjectSettingImg"
            className="w-full h-full object-fill object-center"
          />
        </div>
        <div className="w-full relative flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-xl font-semibold text-custom-text-100 text-left">
              &#x1F6A7; Looks like something went wrong!
            </h1>
            <span className="text-base font-medium text-custom-text-200 text-left">
              We track these errors automatically and working on getting things back up and running. If the problem
              persists feel free to contact us. In the meantime, try refreshing.
            </span>
          </div>

          <div className="flex items-center justify-start gap-6 mt-1">
            {linkMap.map((link) => (
              <div key={link.key}>
                <a
                  href={link.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-custom-primary-100 hover:underline text-sm"
                >
                  {link.label}
                </a>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-start gap-6">
            <Button variant="primary" size="md" onClick={() => router.push("/")}>
              Go to home
            </Button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
