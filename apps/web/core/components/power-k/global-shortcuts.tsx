"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { ShortcutsModal } from "../command-palette/shortcuts-modal/modal";
import { usePowerKCommands } from "./config/commands";
import { detectContextFromURL } from "./core/context-detector";
import { ShortcutHandler } from "./core/shortcut-handler";
import type { TPowerKContext } from "./core/types";

type GlobalShortcutsProps = {
  context: TPowerKContext;
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
    context,
    workspaceSlug,
    projectId,
    issueId,
    currentUserId,
    canPerformAnyCreateAction = false,
    canPerformWorkspaceActions = false,
    canPerformProjectActions = false,
  } = props;
  // router
  const pathname = usePathname();
  const router = useAppRouter();
  const params = useParams();
  const commandPaletteStore = useCommandPalette();
  const commands = usePowerKCommands(context);

  // Detect context from URL and update store
  useEffect(() => {
    const detected = detectContextFromURL(params, pathname);
    commandPaletteStore.setActiveContextV2(detected);
  }, [params, pathname, commandPaletteStore]);

  // Register commands on mount
  useEffect(() => {
    const registry = commandPaletteStore.getCommandRegistryV2();

    registry.clear();
    registry.registerMultiple(commands);
  }, [commandPaletteStore, commands]);

  // Setup global shortcut handler
  useEffect(() => {
    const registry = commandPaletteStore.getCommandRegistryV2();

    const handler = new ShortcutHandler(
      registry,
      () => context,
      () => commandPaletteStore.toggleCommandPaletteModal(true)
    );

    document.addEventListener("keydown", handler.handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handler.handleKeyDown);
      handler.destroy();
    };
  }, [
    context,
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
