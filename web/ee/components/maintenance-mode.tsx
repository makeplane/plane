"use client";

import { FC } from "react";
import Image from "next/image";
// ui
import { Button } from "@plane/ui";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// images
import maintenanceModeImage from "@/public/maintenance-mode.webp";

export const MaintenanceMode: FC = () => {
  // assets
  const asset = maintenanceModeImage;

  return (
    <DefaultLayout>
      <div className="relative container mx-auto h-full w-full flex flex-col md:flex-row gap-2 items-center justify-center gap-y-5 bg-custom-background-100 text-center">
        <div className="relative w-full">
          <Image
            src={asset}
            height="176"
            width="288"
            alt="ProjectSettingImg"
            className="w-full h-full object-fill object-center"
          />
        </div>
        <div className="w-full space-y-4 relative flex flex-col justify-center md:justify-start items-center md:items-start">
          <h1 className="text-xl font-medium text-custom-text-100 text-center md:text-left">
            We are experiencing a sudden, overwhelming spike in traffic and are upgrading our infra to handle it. <br />
            Please come back in an hour or so or check our&nbsp;
            <a
              href="https://dub.sh/planepowershq"
              target="_blank"
              className="text-custom-primary-100/80 hover:text-custom-primary-100 transition-all"
            >
              X.com
            </a>
            &nbsp;handle.
          </h1>
          <Button variant="outline-primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </DefaultLayout>
  );
};
