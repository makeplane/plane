"use client";

import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { creationCommandsRegistry } from "@/plane-web/components/command-palette/power-k/commands/creation-commands";
// local imports
import { navigationCommandsRegistry, settingsCommandsRegistry, accountCommandsRegistry } from "../commands";
import type { CommandConfig, CommandContext, CommandExecutionContext, TPowerKPageKeys } from "../types";

type TCommandRegistryInitializerArgs = {
  setPages: (pages: TPowerKPageKeys[] | ((pages: TPowerKPageKeys[]) => TPowerKPageKeys[])) => void;
  setSearchTerm: (term: string) => void;
  closePalette: () => void;
  isWorkspaceLevel: boolean;
};

/**
 * Centralized hook for accessing the command registry from MobX store
 * This should only be used to initialize the registry with commands once
 */
export const useCommandRegistryInitializer = (args: TCommandRegistryInitializerArgs) => {
  const { setPages, setSearchTerm, closePalette, isWorkspaceLevel } = args;
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  // store hooks
  const { getCommandRegistry } = useCommandPalette();
  const { canPerformAnyCreateAction } = useUser();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const projectId = routerProjectId?.toString();
  const registry = getCommandRegistry();
  // permissions
  const canPerformWorkspaceActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const context: CommandContext = useMemo(
    () => ({
      workspaceSlug: workspaceSlug?.toString(),
      projectId,
      isWorkspaceLevel,
      canPerformAnyCreateAction,
      canPerformWorkspaceActions,
      canPerformProjectActions: allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug?.toString(),
        projectId
      ),
    }),
    [
      workspaceSlug,
      projectId,
      isWorkspaceLevel,
      canPerformAnyCreateAction,
      canPerformWorkspaceActions,
      allowPermissions,
    ]
  );

  const executionContext: CommandExecutionContext = useMemo(
    () => ({
      closePalette,
      router,
      setPages,
      setSearchTerm,
      context,
      updateContext: () => {}, // Will be properly implemented during UI integration
    }),
    [closePalette, router, setPages, setSearchTerm, context]
  );

  const openWorkspaceSettings = useCallback(() => {
    setSearchTerm("");
    setPages((pages) => [...pages, "settings"]);
  }, [setSearchTerm, setPages]);

  const initializeCommands = useCallback(() => {
    // Clear existing commands to avoid duplicates
    registry.clear();

    const commands: CommandConfig[] = [
      ...creationCommandsRegistry(),
      ...navigationCommandsRegistry(),
      ...accountCommandsRegistry(executionContext),
      ...settingsCommandsRegistry(openWorkspaceSettings, () => canPerformWorkspaceActions),
    ];

    registry.registerMultiple(commands);
  }, [registry, executionContext, openWorkspaceSettings, canPerformWorkspaceActions]);

  return {
    registry,
    context,
    executionContext,
    initializeCommands,
  };
};

/**
 * Simple hook to access the centralized command registry from MobX store
 * Use this in child components that only need to access the registry
 */
export const useCommandRegistry = () => {
  const { getCommandRegistry } = useCommandPalette();
  const registry = getCommandRegistry();

  return { registry };
};
