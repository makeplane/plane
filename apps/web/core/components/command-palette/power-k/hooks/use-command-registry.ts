"use client";

import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { navigationCommandsRegistry, settingsCommandsRegistry, accountCommandsRegistry } from "../commands";
import type { CommandConfig, CommandContext, CommandExecutionContext } from "../types";

type TCommandRegistryInitializerArgs = {
  setPages: (pages: string[] | ((pages: string[]) => string[])) => void;
  setPlaceholder: (placeholder: string) => void;
  setSearchTerm: (term: string) => void;
  closePalette: () => void;
  openProjectList: () => void;
  openCycleList: () => void;
  openIssueList: () => void;
  isWorkspaceLevel: boolean;
};

/**
 * Centralized hook for accessing the command registry from MobX store
 * This should only be used to initialize the registry with commands once
 */
export const useCommandRegistryInitializer = (args: TCommandRegistryInitializerArgs) => {
  const {
    setPages,
    setPlaceholder,
    setSearchTerm,
    closePalette,
    openProjectList,
    openCycleList,
    openIssueList,
    isWorkspaceLevel,
  } = args;
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  // store hooks
  const { toggleCreateIssueModal, toggleCreateProjectModal, getCommandRegistry } = useCommandPalette();
  const { workspaceProjectIds } = useProject();
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
      setPlaceholder,
      setSearchTerm,
      context,
      updateContext: () => {}, // Will be properly implemented during UI integration
    }),
    [closePalette, router, setPages, setPlaceholder, setSearchTerm, context]
  );

  const openWorkspaceSettings = useCallback(() => {
    setPlaceholder("Search workspace settings");
    setSearchTerm("");
    setPages((pages) => [...pages, "settings"]);
  }, [setPlaceholder, setSearchTerm, setPages]);

  const initializeCommands = useCallback(() => {
    // Clear existing commands to avoid duplicates
    registry.clear();

    const commands: CommandConfig[] = [
      ...navigationCommandsRegistry(),
      ...accountCommandsRegistry(executionContext),
      ...settingsCommandsRegistry(openWorkspaceSettings, () => canPerformWorkspaceActions),
    ];

    registry.registerMultiple(commands);
  }, [
    registry,
    workspaceSlug,
    workspaceProjectIds,
    canPerformAnyCreateAction,
    canPerformWorkspaceActions,
    openProjectList,
    openCycleList,
    openIssueList,
    toggleCreateIssueModal,
    toggleCreateProjectModal,
    openWorkspaceSettings,
  ]);

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
