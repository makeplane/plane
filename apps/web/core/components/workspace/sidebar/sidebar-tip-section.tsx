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

import { useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { observer } from "mobx-react";
import type { TTips } from "@plane/types";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";

type TTipItem = {
  id: TTips;
  title: string;
  description: string;
  imageLight: string;
  imageDark: string;
};

const TIPS_CONFIG: TTipItem[] = [
  {
    id: "mobile_app_download",
    title: "Download Plane for mobile",
    description: "Manage your work on the go. Download Plane on Play Store and App Store.",
    imageLight: "/tips/download-app/download-app-light.webp",
    imageDark: "/tips/download-app/download-app-dark.webp",
  },
  // Add more tips here in the future
];

export const SidebarTipSection = observer(() => {
  const { workspaceSlug } = useParams();
  const { resolvedTheme } = useTheme();
  const { workspaceInfoBySlug } = useUserPermissions();
  const {
    workspace: { updateTips },
  } = useMember();

  const workspaceSlugStr = workspaceSlug?.toString() ?? "";
  const currentWorkspaceInfo = workspaceInfoBySlug(workspaceSlugStr);

  // Find the first tip that hasn't been dismissed
  const activeTip = useMemo(() => {
    if (!currentWorkspaceInfo?.tips) return TIPS_CONFIG[0];

    return TIPS_CONFIG.find((tip) => currentWorkspaceInfo.tips[tip.id] !== true) ?? null;
  }, [currentWorkspaceInfo?.tips]);

  const backgroundImage = useMemo(
    () => (activeTip ? (resolvedTheme === "dark" ? activeTip.imageDark : activeTip.imageLight) : ""),
    [resolvedTheme, activeTip]
  );

  const handleDismissTip = useCallback(() => {
    if (!workspaceSlugStr || !activeTip) return;
    void updateTips(workspaceSlugStr, { [activeTip.id]: true });
  }, [workspaceSlugStr, activeTip, updateTips]);

  const backgroundStyle = useMemo(
    () => ({
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover" as const,
      backgroundPosition: "center" as const,
      backgroundRepeat: "no-repeat" as const,
    }),
    [backgroundImage]
  );

  // Don't show if no active tip
  if (!activeTip) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-100 flex justify-center items-center p-2.5 w-full">
      <div className="w-full z-100 flex rounded-lg flex-col border border-subtle-1 bg-surface-2 shadow-raised-100">
        <span className="relative min-h-36 w-full bg-layer-1 rounded-t-lg" style={backgroundStyle}>
          <div className="absolute top-2 right-2 rounded-full size-5 flex items-center justify-center backdrop-blur-sm bg-white/30 hover:bg-white/50 transition-colors z-10">
            <IconButton
              icon={CloseIcon}
              onClick={handleDismissTip}
              variant="ghost"
              size="sm"
              className="text-white"
              aria-label="Dismiss tip"
            />
          </div>
        </span>
        <div className="flex flex-col gap-1 p-3">
          <span className="text-body-xs-semibold text-primary">{activeTip.title}</span>
          <span className="text-body-xs-regular text-tertiary">{activeTip.description}</span>
        </div>
      </div>
    </div>
  );
});
