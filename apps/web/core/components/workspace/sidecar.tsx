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

import { observer } from "mobx-react";
import { AgentSidecar } from "@/components/agents/sidecar";
import { PiChatFloatingBot } from "@/components/pi-chat/floating-bot";
import { useTheme } from "@/plane-web/hooks/store";

export const WorkspaceSidecar = observer(function WorkspaceSidecar() {
  const { activeSidecar, isSidecarOpen, closeSidecar, sidecarChatId, openPiChatSidecar } = useTheme();

  if (!isSidecarOpen) return null;

  return (
    <>
      {activeSidecar === "pi-chat" ? (
        <PiChatFloatingBot
          isOpen={activeSidecar === "pi-chat"}
          sidecarChatId={sidecarChatId}
          openPiChatSidecar={openPiChatSidecar}
        />
      ) : (
        <AgentSidecar isOpen={activeSidecar === "agent"} closeSidecar={closeSidecar} />
      )}
    </>
  );
});
