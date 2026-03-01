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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
import { GlobalShortcutsProvider } from "@/components/power-k/global-shortcuts";
import { ProjectsAppPowerKModalWrapper } from "@/components/power-k/ui/modal/wrapper";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { WorkspaceLevelModals } from "@/components/command-palette/modals/workspace-level";
// local imports
import { PlaneAiAppPowerKCommandsList } from "./commands-list";
import { usePlaneAiAppPowerKCommands } from "./config/commands";

/**
 * MobX-aware wrapper for the Command Palette modal
 * Connects the modal to the MobX store
 */
export const PlaneAiAppPowerKProvider = observer(function PlaneAiAppPowerKProvider() {
  // navigation
  const router = useAppRouter();
  const params = useParams();
  // states
  const [activeCommand, setActiveCommand] = useState<TPowerKCommandConfig | null>(null);
  const [shouldShowContextBasedActions, setShouldShowContextBasedActions] = useState(true);
  // store hooks
  const { activeContext, isPowerKModalOpen, togglePowerKModal, setActivePage } = usePowerK();
  const { data: currentUser } = useUser();
  // derived values
  const { workspaceSlug } = params;
  const commands = usePlaneAiAppPowerKCommands();
  // Build command context from props and store
  const context: TPowerKContext = useMemo(
    () => ({
      currentUserId: currentUser?.id,
      activeCommand,
      activeContext,
      shouldShowContextBasedActions,
      setShouldShowContextBasedActions,
      params,
      router,
      closePalette: () => togglePowerKModal(false),
      setActiveCommand,
      setActivePage,
    }),
    [
      currentUser?.id,
      activeCommand,
      activeContext,
      shouldShowContextBasedActions,
      params,
      router,
      togglePowerKModal,
      setActivePage,
    ]
  );

  return (
    <>
      <GlobalShortcutsProvider context={context} commands={commands} />
      {workspaceSlug && <WorkspaceLevelModals workspaceSlug={workspaceSlug.toString()} />}
      <ProjectsAppPowerKModalWrapper
        commandsListComponent={PlaneAiAppPowerKCommandsList}
        context={context}
        isOpen={isPowerKModalOpen}
        onClose={() => togglePowerKModal(false)}
      />
    </>
  );
});
