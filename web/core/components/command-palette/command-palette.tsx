"use client";

import React, { useCallback, useEffect, FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { CommandModal, ShortcutsModal } from "@/components/command-palette";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useUser, useAppTheme, useCommandPalette, useUserPermissions } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import {
  IssueLevelModals,
  ProjectLevelModals,
  WorkspaceLevelModals,
} from "@/plane-web/components/command-palette/modals";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// plane web helpers
import {
  getGlobalShortcutsList,
  getProjectShortcutsList,
  getWorkspaceShortcutsList,
  handleAdditionalKeyDownEvents,
} from "@/plane-web/helpers/command-palette";

export const CommandPalette: FC = observer(() => {
  // router params
  const { workspaceSlug, projectId, issueId } = useParams();
  // store hooks
  const { toggleSidebar } = useAppTheme();
  const { setTrackElement } = useEventTracker();
  const { platform } = usePlatformOS();
  const { data: currentUser, canPerformAnyCreateAction } = useUser();
  const { toggleCommandPaletteModal, isShortcutModalOpen, toggleShortcutModal, isAnyModalOpen } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const canPerformProjectMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  const copyIssueUrlToClipboard = useCallback(() => {
    if (!issueId) return;

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
  }, [issueId]);

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

  const shortcutsList: {
    global: Record<string, { title: string; description: string; action: () => void }>;
    workspace: Record<string, { title: string; description: string; action: () => void }>;
    project: Record<string, { title: string; description: string; action: () => void }>;
  } = useMemo(
    () => ({
      global: getGlobalShortcutsList(),
      workspace: getWorkspaceShortcutsList(),
      project: getProjectShortcutsList(),
    }),
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = e;
      if (!key) return;

      const keyPressed = key.toLowerCase();
      const cmdClicked = ctrlKey || metaKey;
      const shiftClicked = shiftKey;
      const deleteKey = keyPressed === "backspace" || keyPressed === "delete";

      if (cmdClicked && keyPressed === "k" && !isAnyModalOpen) {
        e.preventDefault();
        toggleCommandPaletteModal(true);
      }

      // if on input, textarea or editor, don't do anything
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement ||
        (e.target as Element)?.classList?.contains("ProseMirror")
      )
        return;

      if (shiftClicked && (keyPressed === "?" || keyPressed === "/") && !isAnyModalOpen) {
        e.preventDefault();
        toggleShortcutModal(true);
      }

      if (deleteKey) {
        if (performProjectBulkDeleteActions()) {
          shortcutsList.project.delete.action();
        }
      } else if (cmdClicked) {
        if (keyPressed === "c" && ((platform === "MacOS" && ctrlKey) || altKey)) {
          e.preventDefault();
          copyIssueUrlToClipboard();
        } else if (keyPressed === "b") {
          e.preventDefault();
          toggleSidebar();
        }
      } else if (!isAnyModalOpen) {
        setTrackElement("Shortcut key");
        if (
          Object.keys(shortcutsList.global).includes(keyPressed) &&
          ((!projectId && performAnyProjectCreateActions()) || performProjectCreateActions())
        ) {
          shortcutsList.global[keyPressed].action();
        }
        // workspace authorized actions
        else if (
          Object.keys(shortcutsList.workspace).includes(keyPressed) &&
          workspaceSlug &&
          performWorkspaceCreateActions()
        ) {
          e.preventDefault();
          shortcutsList.workspace[keyPressed].action();
        }
        // project authorized actions
        else if (
          Object.keys(shortcutsList.project).includes(keyPressed) &&
          projectId &&
          performProjectCreateActions()
        ) {
          e.preventDefault();
          // actions that can be performed only inside a project
          shortcutsList.project[keyPressed].action();
        }
      }
      // Additional keydown events
      handleAdditionalKeyDownEvents(e);
    },
    [
      copyIssueUrlToClipboard,
      isAnyModalOpen,
      platform,
      performAnyProjectCreateActions,
      performProjectBulkDeleteActions,
      performProjectCreateActions,
      performWorkspaceCreateActions,
      projectId,
      setTrackElement,
      shortcutsList,
      toggleCommandPaletteModal,
      toggleShortcutModal,
      toggleSidebar,
      workspaceSlug,
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
      <IssueLevelModals />
      <CommandModal />
    </>
  );
});
