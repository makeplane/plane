"use client";

import React from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useTheme as nextUseTheme } from "next-themes";
// ui
import { Button, getButtonStyling } from "@plane/ui";
// helpers
import { resolveGeneralTheme } from "helpers/common.helper";
// hooks
import { useInstance, useTheme } from "@/hooks/store";
// icons
import TakeoffIconLight from "/public/logos/takeoff-icon-light.svg";
import TakeoffIconDark from "/public/logos/takeoff-icon-dark.svg";

export const NewUserPopup: React.FC = observer(() => {
  // hooks
  const { isNewUserPopup, toggleNewUserPopup } = useTheme();
  const { config } = useInstance();
  // theme
  const { resolvedTheme } = nextUseTheme();

  const redirectionLink = `${config?.app_base_url ? `${config?.app_base_url}/create-workspace` : `/god-mode/`}`;

  if (!isNewUserPopup) return <></>;
  return (
    <div className="absolute bottom-8 right-8 p-6 w-96 border border-custom-border-100 shadow-md rounded-lg bg-custom-background-100">
      <div className="flex gap-4">
        <div className="grow">
          <div className="text-base font-semibold">Create workspace</div>
          <div className="py-2 text-sm font-medium text-custom-text-300">
            Instance setup done! Welcome to Plane instance portal. Start your journey with by creating your first
            workspace, you will need to login again.
          </div>
          <div className="flex items-center gap-4 pt-2">
            <a href={redirectionLink} className={getButtonStyling("primary", "sm")}>
              Create workspace
            </a>
            <Button variant="neutral-primary" size="sm" onClick={toggleNewUserPopup}>
              Close
            </Button>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center">
          <Image
            src={resolveGeneralTheme(resolvedTheme) === "dark" ? TakeoffIconDark : TakeoffIconLight}
            height={80}
            width={80}
            alt="Plane icon"
          />
        </div>
      </div>
    </div>
  );
});
