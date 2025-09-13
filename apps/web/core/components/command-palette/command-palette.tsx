"use client";

import React, { useCallback, useEffect, FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { copyTextToClipboard } from "@plane/utils";
import { CommandModal, ShortcutsModal } from "@/components/command-palette";
// helpers
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import {
  IssueLevelModals,
  ProjectLevelModals,
  WorkspaceLevelModals,
} from "@/plane-web/components/command-palette/modals";
// plane web constants
// plane web helpers
import { handleAdditionalKeyDownEvents } from "@/plane-web/helpers/command-palette";
import { useCommandRegistry } from "./utils/use-command-registry";
import { getDefaultCommands } from "./utils/commands";

export const CommandPalette: FC = observer(() => {
  // router params
  const { workspaceSlug, projectId: paramsProjectId, workItem } = useParams();
  // store hooks
  const { fetchIssueWithIdentifier } = useIssueDetail();
  const { toggleSidebar } = useAppTheme();
  const { platform } = usePlatformOS();
  const { data: currentUser, canPerformAnyCreateAction } = useUser();
  const {
    toggleCommandPaletteModal,
    isShortcutModalOpen,
    toggleShortcutModal,
    isAnyModalOpen,
    toggleCreateIssueModal,
    toggleCreateProjectModal,
    toggleCreatePageModal,
    toggleCreateModuleModal,
    toggleCreateCycleModal,
    toggleCreateViewModal,
    toggleBulkDeleteIssueModal,
  } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { workspaceProjectIds } = useProject();

  // derived values
  const projectIdentifier = workItem?.toString().split("-")[0];
  const sequence_id = workItem?.toString().split("-")[1];

  const { data: issueDetails } = useSWR(
    workspaceSlug && workItem ? `ISSUE_DETAIL_${workspaceSlug}_${projectIdentifier}_${sequence_id}` : null,
    workspaceSlug && workItem
      ? () => fetchIssueWithIdentifier(workspaceSlug.toString(), projectIdentifier, sequence_id)
      : null
  );

  const issueId = issueDetails?.id;
  const projectId = paramsProjectId?.toString() ?? issueDetails?.project_id;

  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const canPerformProjectMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    projectId
  );
  const canPerformProjectAdminActions = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    projectId
  );

  const copyIssueUrlToClipboard = useCallback(() => {
    if (!workItem) return;

    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Copied to clipboard",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Some error occurred",
        });
      });
  }, [workItem]);

  // auth
  const performProjectCreateActions = useCallback(
    (showToast: boolean = true) => {
      if (!canPerformProjectMemberActions && showToast)
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "You don't have permission to perform this action.",
        });

      return canPerformProjectMemberActions;
    },
    [canPerformProjectMemberActions]
  );

  const performProjectBulkDeleteActions = useCallback(
    (showToast: boolean = true) => {
      if (!canPerformProjectAdminActions && projectId && showToast)
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "You don't have permission to perform this action.",
        });

      return canPerformProjectAdminActions;
    },
    [canPerformProjectAdminActions, projectId]
  );

  const performWorkspaceCreateActions = useCallback(
    (showToast: boolean = true) => {
      if (!canPerformWorkspaceMemberActions && showToast)
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "You don't have permission to perform this action.",
        });
      return canPerformWorkspaceMemberActions;
    },
    [canPerformWorkspaceMemberActions]
  );

  const performAnyProjectCreateActions = useCallback(
    (showToast: boolean = true) => {
      if (!canPerformAnyCreateAction && showToast)
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "You don't have permission to perform this action.",
        });
      return canPerformAnyCreateAction;
    },
    [canPerformAnyCreateAction]
  );

  const commandActions = useMemo(
    () =>
      getDefaultCommands({
        toggleCreateIssueModal,
        toggleCreateProjectModal,
        toggleCreatePageModal,
        toggleCreateModuleModal,
        toggleCreateCycleModal,
        toggleCreateViewModal,
        toggleBulkDeleteIssueModal,
        performAnyProjectCreateActions: () => performAnyProjectCreateActions(),
        performWorkspaceCreateActions: () => performWorkspaceCreateActions(),
        performProjectCreateActions: () => performProjectCreateActions(),
        performProjectBulkDeleteActions: () => performProjectBulkDeleteActions(),
        workspaceSlug: workspaceSlug?.toString(),
        projectId: projectId?.toString(),
        hasProjects: workspaceProjectIds && workspaceProjectIds.length > 0,
      }),
    [
      performAnyProjectCreateActions,
      performProjectBulkDeleteActions,
      performProjectCreateActions,
      performWorkspaceCreateActions,
      workspaceProjectIds,
      projectId,
      toggleBulkDeleteIssueModal,
      toggleCreateCycleModal,
      toggleCreateIssueModal,
      toggleCreateModuleModal,
      toggleCreatePageModal,
      toggleCreateProjectModal,
      toggleCreateViewModal,
      workspaceSlug,
    ]
  );

  const { groups: commandGroups, handleKeyDown: handleCommandKeyDown } = useCommandRegistry(commandActions);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = e;
      if (!key) return;

      const keyPressed = key.toLowerCase();
      const cmdClicked = ctrlKey || metaKey;
      const shiftClicked = shiftKey;

      if (cmdClicked && keyPressed === "k" && !isAnyModalOpen) {
        e.preventDefault();
        toggleCommandPaletteModal(true);
      }

      const target = e.target as Element;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.classList.contains("ProseMirror")
      )
        return;

      if (shiftClicked && (keyPressed === "?" || keyPressed === "/") && !isAnyModalOpen) {
        e.preventDefault();
        toggleShortcutModal(true);
        return;
      }

      if (cmdClicked) {
        if (keyPressed === "c" && ((platform === "MacOS" && ctrlKey) || altKey)) {
          e.preventDefault();
          copyIssueUrlToClipboard();
          return;
        }
        if (keyPressed === "b") {
          e.preventDefault();
          toggleSidebar();
          return;
        }
      }

      if (handleCommandKeyDown(e)) return;

      handleAdditionalKeyDownEvents(e);
    },
    [
      copyIssueUrlToClipboard,
      handleCommandKeyDown,
      isAnyModalOpen,
      platform,
      toggleCommandPaletteModal,
      toggleShortcutModal,
      toggleSidebar,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentUser) return null;

  return (
    <>
      <ShortcutsModal isOpen={isShortcutModalOpen} onClose={() => toggleShortcutModal(false)} />
      {workspaceSlug && <WorkspaceLevelModals workspaceSlug={workspaceSlug.toString()} />}
      {workspaceSlug && projectId && (
        <ProjectLevelModals workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      )}
      <IssueLevelModals projectId={projectId} issueId={issueId} />
      <CommandModal commandGroups={commandGroups} />
    </>
  );
});
