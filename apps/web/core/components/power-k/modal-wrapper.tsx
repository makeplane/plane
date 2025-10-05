"use client";

import { observer } from "mobx-react";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { IssueLevelModals } from "@/plane-web/components/command-palette/modals/issue-level";
import { ProjectLevelModals } from "@/plane-web/components/command-palette/modals/project-level";
import { WorkspaceLevelModals } from "@/plane-web/components/command-palette/modals/workspace-level";
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
  // store hooks
  const commandPaletteStore = useCommandPalette();

  return (
    <>
      <CommandPaletteV2GlobalShortcuts
        workspaceSlug={workspaceSlug?.toString()}
        projectId={projectId?.toString()}
        currentUserId={currentUserId}
        canPerformAnyCreateAction
        canPerformWorkspaceActions
        canPerformProjectActions
        toggleCreateIssueModal={(open) => commandPaletteStore.toggleCreateIssueModal(open)}
        toggleCreateProjectModal={(open) => commandPaletteStore.toggleCreateProjectModal(open)}
        toggleCreateCycleModal={(open) => commandPaletteStore.toggleCreateCycleModal(open)}
        deleteIssue={(issueId) => console.log("Delete issue:", issueId)}
      />
      {workspaceSlug && <WorkspaceLevelModals workspaceSlug={workspaceSlug.toString()} />}
      {workspaceSlug && projectId && (
        <ProjectLevelModals workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      )}
      <IssueLevelModals projectId={projectId} issueId={issueId} />
      <CommandPaletteModal
        isOpen={commandPaletteStore.isCommandPaletteOpen}
        onClose={() => commandPaletteStore.toggleCommandPaletteModal(false)}
        {...props}
      />
    </>
  );
});
