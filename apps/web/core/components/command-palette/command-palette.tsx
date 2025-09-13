"use client";

import React, { useCallback, FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { COMMAND_PALETTE_TRACKER_ELEMENTS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { copyTextToClipboard } from "@plane/utils";
import { CommandModal, ShortcutsModal } from "@/components/command-palette";
import { useShortcuts, Shortcut } from "./use-shortcuts";
// helpers
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import {
  IssueLevelModals,
  ProjectLevelModals,
  WorkspaceLevelModals,
} from "@/plane-web/components/command-palette/modals";
// plane web constants
// plane web helpers
import {
  getGlobalShortcutsList,
  getProjectShortcutsList,
  getWorkspaceShortcutsList,
  handleAdditionalKeyDownEvents,
} from "@/plane-web/helpers/command-palette";

export const CommandPalette: FC = observer(() => {
  // router params
  const { workspaceSlug, projectId: paramsProjectId, workItem } = useParams();
  // store hooks
  const { fetchIssueWithIdentifier } = useIssueDetail();
  const { toggleSidebar } = useAppTheme();
  const { platform } = usePlatformOS();
  const { data: currentUser, canPerformAnyCreateAction } = useUser();
  const { toggleCommandPaletteModal, isShortcutModalOpen, toggleShortcutModal, isAnyModalOpen } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

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

  const isEditable = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    return (
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLInputElement ||
      target.isContentEditable ||
      target.classList.contains("ProseMirror")
    );
  };

  const shortcuts: Shortcut[] = useMemo(() => {
    const list: Shortcut[] = [
      {
        keys: ["meta", "k"],
        handler: () => toggleCommandPaletteModal(true),
        enabled: () => !isAnyModalOpen,
      },
      {
        keys: ["control", "k"],
        handler: () => toggleCommandPaletteModal(true),
        enabled: () => !isAnyModalOpen,
      },
      {
        keys: ["shift", "?"],
        handler: () => toggleShortcutModal(true),
        enabled: () => !isAnyModalOpen,
      },
      {
        keys: ["shift", "/"],
        handler: () => toggleShortcutModal(true),
        enabled: () => !isAnyModalOpen,
      },
      {
        keys: platform === "MacOS" ? ["control", "meta", "c"] : ["control", "alt", "c"],
        handler: () => copyIssueUrlToClipboard(),
        enabled: () => !!workItem,
      },
      {
        keys: ["meta", "b"],
        handler: () => toggleSidebar(),
        enabled: (e) => !isEditable(e),
      },
      {
        keys: ["control", "b"],
        handler: () => toggleSidebar(),
        enabled: (e) => !isEditable(e),
      },
    ];

    Object.keys(shortcutsList.global).forEach((k) => {
      list.push({
        sequence: [k],
        handler: () => {
          captureClick({ elementName: COMMAND_PALETTE_TRACKER_ELEMENTS.COMMAND_PALETTE_SHORTCUT_KEY });
          shortcutsList.global[k].action();
        },
        enabled: (e) =>
          !isEditable(e) &&
          !isAnyModalOpen &&
          (((!projectId && performAnyProjectCreateActions()) || performProjectCreateActions())),
      });
    });

    Object.keys(shortcutsList.workspace).forEach((k) => {
      list.push({
        sequence: [k],
        handler: () => {
          captureClick({ elementName: COMMAND_PALETTE_TRACKER_ELEMENTS.COMMAND_PALETTE_SHORTCUT_KEY });
          shortcutsList.workspace[k].action();
        },
        enabled: (e) =>
          !isEditable(e) &&
          !isAnyModalOpen &&
          !!workspaceSlug &&
          performWorkspaceCreateActions(),
      });
    });

    Object.entries(shortcutsList.project).forEach(([k, v]) => {
      const isDeleteKey = k === "delete" || k === "backspace";
      list.push({
        sequence: [k],
        handler: () => {
          captureClick({ elementName: COMMAND_PALETTE_TRACKER_ELEMENTS.COMMAND_PALETTE_SHORTCUT_KEY });
          v.action();
        },
        enabled: (e) =>
          !isEditable(e) &&
          !isAnyModalOpen &&
          !!projectId &&
          (isDeleteKey ? performProjectBulkDeleteActions() : performProjectCreateActions()),
      });
    });

    return list;
  }, [
    copyIssueUrlToClipboard,
    isAnyModalOpen,
    performAnyProjectCreateActions,
    performProjectBulkDeleteActions,
    performProjectCreateActions,
    performWorkspaceCreateActions,
    platform,
    projectId,
    shortcutsList,
    toggleCommandPaletteModal,
    toggleShortcutModal,
    toggleSidebar,
    workspaceSlug,
    workItem,
  ]);

  useShortcuts(shortcuts, { additional: handleAdditionalKeyDownEvents });

  if (!currentUser) return null;

  return (
    <>
      <ShortcutsModal isOpen={isShortcutModalOpen} onClose={() => toggleShortcutModal(false)} />
      {workspaceSlug && <WorkspaceLevelModals workspaceSlug={workspaceSlug.toString()} />}
      {workspaceSlug && projectId && (
        <ProjectLevelModals workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      )}
      <IssueLevelModals projectId={projectId} issueId={issueId} />
      <CommandModal />
    </>
  );
});
