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

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { usePathname } from "next/navigation";
import { cn } from "@plane/utils";
// components
import { AppRailRoot, TopNavigationRoot } from "@/components/navigation";
import { StickyActionBar } from "@/components/stickies/action-bar";
// plane web imports
import { useAppRailVisibility } from "@/lib/app-rail";
import { PiChatArtifactsRoot } from "@/components/pi-chat/actions/artifacts/detail/root";
import { WorkspaceSidecar } from "./sidecar";

export const WorkspaceContentWrapper = observer(function WorkspaceContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const shouldRenderAiCanvas = pathname.split("/").includes("ai-chat");

  // Use the context to determine if app rail should render
  const { shouldRenderAppRail } = useAppRailVisibility();

  return (
    <div className="flex flex-col relative size-full overflow-hidden bg-canvas transition-all ease-in-out duration-300">
      <TopNavigationRoot />
      <div className="relative flex size-full overflow-hidden">
        {/* Conditionally render AppRailRoot based on context */}
        {shouldRenderAppRail && <AppRailRoot />}
        <div
          className={cn(
            "relative size-full pl-2 pb-2 pr-2 flex-grow transition-all ease-in-out duration-300 overflow-hidden",
            {
              "pl-0": shouldRenderAppRail,
            }
          )}
        >
          {children}
          {/* Floating Action Bar */}
          <div className="absolute bottom-4 right-4 z-[25] flex flex-col gap-4" id="floating-bot">
            <StickyActionBar />
          </div>
        </div>
        <div className="pb-2">
          <WorkspaceSidecar />
        </div>
        {shouldRenderAiCanvas && (
          <div className="pb-2">
            <PiChatArtifactsRoot />
          </div>
        )}
      </div>
    </div>
  );
});
