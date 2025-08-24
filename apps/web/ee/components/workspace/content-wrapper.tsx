"use client";
import React from "react";
import { FloatingActionsRoot } from "app/(all)/[workspaceSlug]/(projects)/floating-action-bar";
import { observer } from "mobx-react";
// plane imports
import { useParams, usePathname } from "next/navigation";
import { cn } from "@plane/utils";
// components
import { StickyActionBar } from "@/components/stickies/action-bar";
// hooks
import { useAppRail } from "@/hooks/use-app-rail";
// plane web imports
import { AppRailRoot } from "@/plane-web/components/app-rail";
import { isPiAllowed } from "@/plane-web/helpers/pi-chat.helper";
// local imports
import { PiChatFloatingBot } from "../pi-chat/floating-bot";

export const WorkspaceContentWrapper = observer(({ children }: { children: React.ReactNode }) => {
  const { shouldRenderAppRail } = useAppRail();
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const shouldRenderPiChat = isPiAllowed(pathname.replace(`/${workspaceSlug}`, ""));

  return (
    <div className="flex relative size-full overflow-hidden bg-custom-background-90 rounded-lg transition-all ease-in-out duration-300">
      {shouldRenderAppRail && <AppRailRoot />}
      <div
        className={cn("relative size-full p-2 flex-grow transition-all ease-in-out duration-300 overflow-hidden", {
          "pl-0": shouldRenderAppRail,
        })}
      >
        {children}
        <FloatingActionsRoot>
          <StickyActionBar />
        </FloatingActionsRoot>
      </div>
      {shouldRenderPiChat && (
        <div className="py-2">
          <PiChatFloatingBot />
        </div>
      )}
    </div>
  );
});
