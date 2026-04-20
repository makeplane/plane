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

import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Maximize } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import { BetaBadge } from "@/components/common/beta";
import { WithAiFeatureFlagHOC } from "@/components/feature-flags/with-ai-feature-flag-hoc";
import { InputBox } from "@/components/pi-chat/input";
import { UnauthorizedView } from "@/components/pi-chat/unauthorized";

export const HomePageHeader = observer(function HomePageHeader() {
  const { workspaceSlug } = useParams();
  const { activeChatId, isWorkspaceAuthorized, initPiChat } = usePiChat();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const isPiEnabled = workspaceSlug
    ? isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PI_ENABLED)
    : false;

  useEffect(() => {
    if (!isPiEnabled) return;
    void initPiChat();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isPiEnabled) return;
  return (
    <WithAiFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="AI_CHAT">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <div className="text-14 font-semibold text-tertiary">Ask AI</div>
            <BetaBadge />
          </div>
          <Tooltip tooltipContent="Maximize" position="top">
            <Link href={`/${workspaceSlug}/projects/ai-chat/${activeChatId}`}>
              <Maximize className="size-4 text-tertiary" />
            </Link>
          </Tooltip>
        </div>
        {isWorkspaceAuthorized ? (
          <InputBox
            isFullScreen
            onlyInput={true}
            isProjectLevel
            showProgress // Required since its taken to a whole different page
            className="relative bg-transparent mt-2 max-w-[950px] mx-auto w-full"
            activeChatId={activeChatId}
          />
        ) : (
          <UnauthorizedView
            className="border border-subtle/40 rounded-lg p-4 mt-3 max-h-[164px] justify-start"
            imgClassName="h-[117px]"
          />
        )}
      </div>
    </WithAiFeatureFlagHOC>
  );
});
