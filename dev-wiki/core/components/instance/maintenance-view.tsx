"use client";

import { FC } from "react";
import Image from "next/image";
// ui
import { Button } from "@plane/ui";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// components
import { MaintenanceMessage } from "@/plane-web/components/instance";
// images
import maintenanceModeImage from "@/public/maintenance-mode.webp";

export const MaintenanceView: FC = () => (
  <DefaultLayout>
    <div className="relative container mx-auto h-full w-full flex flex-col md:flex-row gap-2 items-center justify-center gap-y-5 bg-custom-background-100 text-center">
      <div className="relative w-full">
        <Image
          src={maintenanceModeImage}
          height="176"
          width="288"
          alt="ProjectSettingImg"
          className="w-full h-full object-fill object-center"
        />
      </div>
      <div className="w-full space-y-4 relative flex flex-col justify-center md:justify-start items-center md:items-start">
        <MaintenanceMessage />
        <Button variant="outline-primary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  </DefaultLayout>
);
