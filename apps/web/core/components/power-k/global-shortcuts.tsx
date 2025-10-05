"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAppRouter } from "@/hooks/use-app-router";
import { ShortcutsModal } from "../command-palette/shortcuts-modal/modal";
import { getExampleCommands } from "./config/commands";
import { detectContextFromURL } from "./core/context-detector";
import { ShortcutHandler } from "./core/shortcut-handler";
import type { TPowerKContext } from "./core/types";

type GlobalShortcutsProps = {
  workspaceSlug?: string;
  projectId?: string;
  issueId?: string;
  currentUserId?: string;
  canPerformAnyCreateAction?: boolean;
  canPerformWorkspaceActions?: boolean;
  canPerformProjectActions?: boolean;
  toggleCreateIssueModal?: (open: boolean) => void;
  toggleCreateProjectModal?: (open: boolean) => void;
  toggleCreateCycleModal?: (open: boolean) => void;
  deleteIssue?: (issueId: string) => void;
};

/**
 * Global shortcuts component - sets up keyboard listeners and context detection
 * Should be mounted once at the app root level
 */
export const CommandPaletteV2GlobalShortcuts = observer((props: GlobalShortcutsProps) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    currentUserId,
    canPerformAnyCreateAction = false,
    canPerformWorkspaceActions = false,
    canPerformProjectActions = false,
    toggleCreateIssueModal = () => {},
    toggleCreateProjectModal = () => {},
    toggleCreateCycleModal = () => {},
    deleteIssue = () => {},
  } = props;
  // router
  const pathname = usePathname();
  const router = useAppRouter();
  const params = useParams();
  const commandPaletteStore = useCommandPalette();

  // Detect context from URL and update store
  useEffect(() => {
    const detected = detectContextFromURL(params, pathname);
    commandPaletteStore.setContextEntityV2(detected);
  }, [params, pathname, commandPaletteStore]);

  // Register commands on mount
  useEffect(() => {
    const commands = getExampleCommands(
      toggleCreateIssueModal,
      toggleCreateProjectModal,
      toggleCreateCycleModal,
      deleteIssue
    );
    const registry = commandPaletteStore.getCommandRegistryV2();
    registry.clear();
    registry.registerMultiple(commands);
  }, [toggleCreateIssueModal, toggleCreateProjectModal, toggleCreateCycleModal, deleteIssue, commandPaletteStore]);

  // Setup global shortcut handler
  useEffect(() => {
    const commandContext: TPowerKContext = {
      workspaceSlug,
      projectId,
      issueId,
      currentUserId,
      contextEntity: commandPaletteStore.contextEntityV2,
      canPerformAnyCreateAction,
      canPerformWorkspaceActions,
      canPerformProjectActions,
      router,
      closePalette: () => commandPaletteStore.toggleCommandPaletteModal(false),
      setActivePage: (page) => commandPaletteStore.setActivePageV2(page),
    };

    const registry = commandPaletteStore.getCommandRegistryV2();
    const handler = new ShortcutHandler(
      registry,
      () => commandContext,
      () => commandPaletteStore.toggleCommandPaletteModal(true)
    );

    document.addEventListener("keydown", handler.handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handler.handleKeyDown);
      handler.destroy();
    };
  }, [
    workspaceSlug,
    projectId,
    issueId,
    currentUserId,
    canPerformAnyCreateAction,
    canPerformWorkspaceActions,
    canPerformProjectActions,
    router,
    commandPaletteStore,
  ]);

  return (
    <ShortcutsModal
      isOpen={commandPaletteStore.isShortcutModalOpen}
      onClose={() => commandPaletteStore.toggleShortcutModal(false)}
    />
  );
});
