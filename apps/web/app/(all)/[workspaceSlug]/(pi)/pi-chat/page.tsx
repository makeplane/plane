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

import { PageHead } from "@/components/core/page-title";
import { PiChatDetail } from "@/components/pi-chat/detail";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { FeatureTour } from "@/components/tour";
import { useRouter } from "next/navigation";
import type { Route } from "./+types/page";
import { WithAiFeatureFlagHOC } from "@/components/feature-flags/with-ai-feature-flag-hoc";

function NewChatPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // store hooks
  const { initPiChat } = usePiChat();
  const router = useRouter();
  useEffect(() => {
    initPiChat();
  }, []);
  return (
    <>
      <PageHead title="Plane AI" />
      <PiChatDetail isFullScreen />
      <WithAiFeatureFlagHOC
        flag="AI_MCP_CONNECTORS"
        disabledFallback={<></>}
        workspaceSlug={workspaceSlug?.toString() || ""}
      >
        <FeatureTour
          tourType="mcp_connectors"
          onComplete={
            () => router.push(`/${workspaceSlug}/settings/integrations?tab=connectors`) // Redirect to tours settings page on completion
          }
        />
      </WithAiFeatureFlagHOC>
    </>
  );
}

export default observer(NewChatPage);
