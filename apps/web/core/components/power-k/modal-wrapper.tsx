"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { IssueLevelModals } from "@/plane-web/components/command-palette/modals/issue-level";
import { ProjectLevelModals } from "@/plane-web/components/command-palette/modals/project-level";
import { WorkspaceLevelModals } from "@/plane-web/components/command-palette/modals/workspace-level";
// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "./core/types";
import { CommandPaletteV2GlobalShortcuts } from "./global-shortcuts";
import { CommandPaletteModal } from "./ui/modal/root";

/**
 * MobX-aware wrapper for the Command Palette V2 modal
 * Connects the modal to the MobX store
 */
export const CommandPaletteV2ModalWrapper = observer(() => {
  // router
  const router = useAppRouter();
  const params = useParams();
  // states
  const [activeCommand, setActiveCommand] = useState<TPowerKCommandConfig | null>(null);
  // store hooks
  const commandPaletteStore = useCommandPalette();
  const { data: currentUser } = useUser();
  // derived values
  const { activeContextV2 } = commandPaletteStore;
  const { workspaceSlug, projectId, workItem: workItemIdentifier } = params;

  // Build command context from props and store
  const context: TPowerKContext = useMemo(
    () => ({
      currentUserId: currentUser?.id,
      activeCommand,
      activeContext: activeContextV2,
      params,
      router,
      closePalette: () => commandPaletteStore.toggleCommandPaletteModal(false),
      setActiveCommand,
      setActivePage: (page) => commandPaletteStore.setActivePageV2(page),
    }),
    [currentUser?.id, activeContextV2, commandPaletteStore, router, params, activeCommand]
  );

  return (
    <>
      <CommandPaletteV2GlobalShortcuts
        context={context}
        workspaceSlug={workspaceSlug?.toString()}
        projectId={projectId?.toString()}
        currentUserId={currentUser?.id}
        canPerformAnyCreateAction
        canPerformWorkspaceActions
        canPerformProjectActions
        deleteIssue={(issueId) => console.log("Delete issue:", issueId)}
      />
      {workspaceSlug && <WorkspaceLevelModals workspaceSlug={workspaceSlug.toString()} />}
      {workspaceSlug && projectId && (
        <ProjectLevelModals workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      )}
      <IssueLevelModals workItemIdentifier={workItemIdentifier?.toString()} />
      <CommandPaletteModal
        context={context}
        isOpen={commandPaletteStore.isCommandPaletteOpen}
        onClose={() => commandPaletteStore.toggleCommandPaletteModal(false)}
      />
    </>
  );
});
