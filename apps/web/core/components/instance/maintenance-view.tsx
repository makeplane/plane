"use client";

import type { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// components
import { MaintenanceMessage } from "@/plane-web/components/instance";
// images
import maintenanceModeDarkModeImage from "@/public/instance/maintenance-mode-dark.svg";
import maintenanceModeLightModeImage from "@/public/instance/maintenance-mode-light.svg";

export const MaintenanceView: FC = () => {
  // hooks
  const { resolvedTheme } = useTheme();
  // derived values
  const maintenanceModeImage = resolvedTheme === "dark" ? maintenanceModeDarkModeImage : maintenanceModeLightModeImage;
  return (
    <DefaultLayout>
      <div className="relative container mx-auto h-full w-full max-w-xl flex flex-col gap-2 items-center justify-center gap-y-6 bg-custom-background-100 text-center">
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
          <MaintenanceMessage />
        </div>
      </div>
    </DefaultLayout>
  );
};
