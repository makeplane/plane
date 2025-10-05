"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { IssueLevelModals } from "@/plane-web/components/command-palette/modals/issue-level";
import { ProjectLevelModals } from "@/plane-web/components/command-palette/modals/project-level";
import { WorkspaceLevelModals } from "@/plane-web/components/command-palette/modals/workspace-level";
// local imports
import type { TPowerKContext } from "./core/types";
import { CommandPaletteV2GlobalShortcuts } from "./global-shortcuts";
import { CommandPaletteModal } from "./ui/modal/root";

type Props = {
  workspaceSlug?: string;
  projectId?: string;
  issueId?: string;
  currentUserId?: string;
  canPerformAnyCreateAction?: boolean;
  canPerformWorkspaceActions?: boolean;
  canPerformProjectActions?: boolean;
};

/**
 * MobX-aware wrapper for the Command Palette V2 modal
 * Connects the modal to the MobX store
 */
export const CommandPaletteV2ModalWrapper = observer((props: Props) => {
  const { workspaceSlug, projectId, issueId, currentUserId } = props;
  // router
  const router = useAppRouter();
  const params = useParams();
  // store hooks
  const commandPaletteStore = useCommandPalette();
  // derived values
  const commandPaletteContext = commandPaletteStore.contextEntityV2;

  // Build command context from props and store
  const context: TPowerKContext = useMemo(
    () => ({
      workspaceSlug,
      projectId,
      issueId,
      currentUserId,
      contextEntity: commandPaletteContext,
      params,
      router,
      closePalette: () => commandPaletteStore.toggleCommandPaletteModal(false),
      setActivePage: (page) => commandPaletteStore.setActivePageV2(page),
    }),
    [workspaceSlug, projectId, issueId, currentUserId, commandPaletteContext, commandPaletteStore, router, params]
  );

  return (
    <>
      <CommandPaletteV2GlobalShortcuts
        context={context}
        workspaceSlug={workspaceSlug?.toString()}
        projectId={projectId?.toString()}
        currentUserId={currentUserId}
        canPerformAnyCreateAction
        canPerformWorkspaceActions
        canPerformProjectActions
        deleteIssue={(issueId) => console.log("Delete issue:", issueId)}
      />
      {workspaceSlug && <WorkspaceLevelModals workspaceSlug={workspaceSlug.toString()} />}
      {workspaceSlug && projectId && (
        <ProjectLevelModals workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      )}
      <IssueLevelModals projectId={projectId} issueId={issueId} />
      <CommandPaletteModal
        context={context}
        isOpen={commandPaletteStore.isCommandPaletteOpen}
        onClose={() => commandPaletteStore.toggleCommandPaletteModal(false)}
        {...props}
      />
    </>
  );
});
