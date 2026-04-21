/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { getButtonStyling } from "@plane/propel/button";
import { cn, resolveGeneralTheme } from "@plane/utils";
import darkState from "@/app/assets/auth/pi-chat-dark.webp?url";
import lightState from "@/app/assets/auth/pi-chat-light.webp?url";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { useTheme as useAppTheme } from "@/plane-web/hooks/store";
import { PI_STARTER } from "@/constants/fetch-keys";

export function UnauthorizedView(props: { className?: string; imgClassName?: string }) {
  const { className, imgClassName } = props;
  // router
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  // store hooks
  const { getInstance } = usePiChat();
  const { resolvedTheme } = useTheme();
  const { activeSidecar } = useAppTheme();
  // derived values
  const isPiChatSidecarOpen = activeSidecar === "pi-chat";
  const isInFullScreen = pathname.includes("/ai-chat");
  // SWR
  const { data: instance } = useSWR(
    workspaceSlug ? PI_STARTER(workspaceSlug) : null,
    workspaceSlug ? () => getInstance(workspaceSlug) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );

  return (
    <div className={"@container w-full h-full"}>
      <div
        className={cn("flex @[400px]:flex-row flex-col size-full items-center justify-center gap-8  px-8", className)}
      >
        <div className="flex max-h-full bg-layer-1 p-12 pr-0 rounded-lg items-center max-w-[350px] overflow-hidden shadow-r-md justify-end">
          <img
            className={cn("w-auto", imgClassName)}
            src={resolveGeneralTheme(resolvedTheme) === "dark" ? darkState : lightState}
            alt="Unauthorized"
          />
        </div>

        <div className="flex flex-col gap-4 max-w-[400px]">
          <div className="flex flex-col gap-2">
            <div className={cn("text-h4-medium text-primary", { "text-h5-medium": !isInFullScreen })}>
              {instance ? "Plane AI can now take actions for you." : "Plane AI failed to startup"}
            </div>
            <div className={cn("text-body-md-regular text-secondary", { "text-body-xs-regular": !isInFullScreen })}>
              {instance
                ? "Use Build mode to create work items, cycles and more. Activate now to start Plane AI actions."
                : "Please contact your admin to check the status of Plane AI and try again."}
            </div>
          </div>
          {instance && !instance?.is_authorized ? (
            <a
              href={`${instance.oauth_url}?sidebar_open_url=${pathname}${isPiChatSidecarOpen ? "?pi_sidebar_open=true" : ""}`}
              className={cn(getButtonStyling("primary", "base"), "w-fit p-2")}
            >
              Activate Build mode
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
