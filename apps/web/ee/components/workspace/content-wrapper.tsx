"use client";
import React from "react";
import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// hooks
import { useAppRail } from "@/hooks/use-app-rail";
// plane web components
import { AppRailRoot } from "@/plane-web/components/app-rail";

export const WorkspaceContentWrapper = observer(({ children }: { children: React.ReactNode }) => {
  const { shouldRenderAppRail } = useAppRail();

  return (
    <div className="flex relative size-full overflow-hidden bg-custom-background-90 rounded-lg transition-all ease-in-out duration-300">
      {shouldRenderAppRail && <AppRailRoot />}
      <div
        className={cn("size-full p-2 flex-grow transition-all ease-in-out duration-300", {
          "pl-0": shouldRenderAppRail,
        })}
      >
        {children}
      </div>
    </div>
  );
});
