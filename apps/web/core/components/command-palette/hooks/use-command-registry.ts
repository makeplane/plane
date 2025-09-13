"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { commandRegistry } from "../command-registry";
import {
  createNavigationCommands,
  createCreationCommands,
  createAccountCommands,
  createSettingsCommands,
} from "../commands";
import { CommandContext, CommandExecutionContext } from "../types";

export const useCommandRegistry = (
  setPages: (pages: string[] | ((pages: string[]) => string[])) => void,
  setPlaceholder: (placeholder: string) => void,
  setSearchTerm: (term: string) => void,
  closePalette: () => void,
  openProjectList: () => void,
  openCycleList: () => void,
  openIssueList: () => void,
  isWorkspaceLevel: boolean
) => {
  const router = useAppRouter();
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  const { toggleCreateIssueModal, toggleCreateProjectModal } = useCommandPalette();
  const { workspaceProjectIds, joinedProjectIds } = useProject();
  const { canPerformAnyCreateAction } = useUser();
  const { allowPermissions } = useUserPermissions();

  const projectId = routerProjectId?.toString();

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
    }),
    [closePalette, router, setPages, setPlaceholder, setSearchTerm, context]
  );

  const createNewWorkspace = useCallback(() => {
    closePalette();
    router.push("/create-workspace");
  }, [closePalette, router]);

  const openThemeSettings = useCallback(() => {
    setPlaceholder("Change interface theme");
    setSearchTerm("");
    setPages((pages) => [...pages, "change-interface-theme"]);
  }, [setPlaceholder, setSearchTerm, setPages]);

  const openWorkspaceSettings = useCallback(() => {
    setPlaceholder("Search workspace settings");
    setSearchTerm("");
    setPages((pages) => [...pages, "settings"]);
  }, [setPlaceholder, setSearchTerm, setPages]);

  useEffect(() => {
    commandRegistry.clear();

    const commands = [
      ...createNavigationCommands(openProjectList, openCycleList, openIssueList),
      ...createCreationCommands(
        toggleCreateIssueModal,
        toggleCreateProjectModal,
        () => canPerformAnyCreateAction,
        () => canPerformWorkspaceActions,
        workspaceSlug?.toString(),
        workspaceProjectIds
      ),
      ...createAccountCommands(createNewWorkspace, openThemeSettings),
      ...createSettingsCommands(openWorkspaceSettings, () => canPerformWorkspaceActions),
    ];

    commandRegistry.registerMultiple(commands);
  }, [
    workspaceSlug,
    workspaceProjectIds,
    canPerformAnyCreateAction,
    canPerformWorkspaceActions,
    openProjectList,
    openCycleList,
    openIssueList,
    toggleCreateIssueModal,
    toggleCreateProjectModal,
    createNewWorkspace,
    openThemeSettings,
    openWorkspaceSettings,
  ]);

  return {
    registry: commandRegistry,
    context,
    executionContext,
  };
};
