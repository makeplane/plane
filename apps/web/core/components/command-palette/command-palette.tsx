"use client";

import React, { useCallback, useEffect, FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { COMMAND_PALETTE_TRACKER_ELEMENTS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { copyTextToClipboard } from "@plane/utils";
import { CommandModal, ShortcutsModal } from "@/components/command-palette";
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
  const { toggleSidebar, toggleExtendedSidebar } = useAppTheme();
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = e;
      if (!key) return;

      const keyPressed = key.toLowerCase();
      const cmdClicked = ctrlKey || metaKey;
      const shiftClicked = shiftKey;
      const deleteKey = keyPressed === "backspace" || keyPressed === "delete";
      
      // Debug: Log all Cmd+I events
      if (cmdClicked && keyPressed === "i") {
        console.log("🎯 Command palette: Raw Cmd+I event detected", {
          key,
          metaKey,
          ctrlKey,
          target: e.target,
          isAnyModalOpen
        });
      }

      // Debug: Log all Cmd+J events to see why it's working
      if (cmdClicked && keyPressed === "j") {
        console.log("🎯 Command palette: Raw Cmd+J event detected", {
          key,
          metaKey,
          ctrlKey,
          target: e.target,
          isAnyModalOpen,
          globalShortcuts: Object.keys(shortcutsList.global),
          workspaceShortcuts: Object.keys(shortcutsList.workspace),
          projectShortcuts: Object.keys(shortcutsList.project)
        });
      }

      if (cmdClicked && keyPressed === "k" && !isAnyModalOpen) {
        e.preventDefault();
        toggleCommandPaletteModal(true);
      }

      // Handle CMD+I for creating new work items
      if (cmdClicked && keyPressed === "i" && !isAnyModalOpen) {
        console.log("🎯 Command palette: Cmd+I detected", {
          projectId,
          hasGlobalShortcutC: Object.keys(shortcutsList.global).includes("c"),
          canPerformAnyCreateAction,
          canPerformProjectMemberActions,
          isAnyModalOpen
        });
        
        e.preventDefault();
        e.stopPropagation();
        
        // Check if we can create work items and trigger the action
        const hasPermission = (!projectId && performAnyProjectCreateActions(false)) || performProjectCreateActions(false);
        console.log("🎯 Command palette: Permission check result", { hasPermission });
        
        if (
          Object.keys(shortcutsList.global).includes("c") &&
          hasPermission
        ) {
          console.log("🎯 Command palette: Triggering create issue modal via Cmd+I");
          shortcutsList.global.c.action();
        } else {
          console.log("🎯 Command palette: Cannot create issue - missing permission or shortcut");
        }
      }

      // Block CMD+J to prevent it from working
      if (cmdClicked && keyPressed === "j" && !isAnyModalOpen) {
        console.log("🎯 Command palette: Blocking Cmd+J - not supported");
        e.preventDefault();
        e.stopPropagation();
        return; // Exit early to prevent any further processing
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
          toggleExtendedSidebar(false);
        }
      } else if (!isAnyModalOpen) {
        captureClick({ elementName: COMMAND_PALETTE_TRACKER_ELEMENTS.COMMAND_PALETTE_SHORTCUT_KEY });
        
        // Debug logging for shortcut processing
        if (keyPressed === "j") {
          console.log("🎯 Command palette: Processing Cmd+J in general shortcut logic", {
            keyPressed,
            globalShortcuts: Object.keys(shortcutsList.global),
            hasGlobalShortcut: Object.keys(shortcutsList.global).includes(keyPressed),
            canPerformActions: (!projectId && performAnyProjectCreateActions()) || performProjectCreateActions()
          });
        }
        
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
      shortcutsList,
      toggleCommandPaletteModal,
      toggleShortcutModal,
      toggleSidebar,
      toggleExtendedSidebar,
      workspaceSlug,
    ]
  );

  useEffect(() => {
    console.log("🎯 Command palette: Adding keydown event listener");
    
    // Simple test handler to see if we can catch Cmd+N at all
    const testHandler = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        console.log("🎯 TEST: Cmd+N detected!", {
          key: e.key,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          target: e.target?.tagName,
          timestamp: Date.now()
        });
      }
    };
    
    // Global handler for Cmd+N - highest priority
    const globalHandler = (e: KeyboardEvent) => {
      if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
        console.log("🎯 Command palette: Cmd+I captured in global handler", {
          key: e.key,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          target: e.target,
          isAnyModalOpen
        });
        
        // Prevent the default browser behavior immediately
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Check if we can create work items and trigger the action
        const hasPermission = (!projectId && performAnyProjectCreateActions(false)) || performProjectCreateActions(false);
        console.log("🎯 Command palette: Permission check result in global", { hasPermission });
        
        if (
          Object.keys(shortcutsList.global).includes("c") &&
          hasPermission
        ) {
          console.log("🎯 Command palette: Triggering create issue modal via Cmd+I in global handler");
          shortcutsList.global.c.action();
        } else {
          console.log("🎯 Command palette: Cannot create issue in global handler - missing permission or shortcut");
        }
      } else if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        console.log("🎯 Command palette: Blocking Cmd+J in global handler");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    
    // Add event listener in capture phase to catch it before browser handles it
    const captureHandler = (e: KeyboardEvent) => {
      if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
        console.log("🎯 Command palette: Cmd+I captured in capture phase", {
          key: e.key,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          target: e.target,
          isAnyModalOpen
        });
        
        // Prevent the default browser behavior immediately
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Check if we can create work items and trigger the action
        const hasPermission = (!projectId && performAnyProjectCreateActions(false)) || performProjectCreateActions(false);
        console.log("🎯 Command palette: Permission check result in capture", { hasPermission });
        
        if (
          Object.keys(shortcutsList.global).includes("c") &&
          hasPermission
        ) {
          console.log("🎯 Command palette: Triggering create issue modal via Cmd+I in capture phase");
          shortcutsList.global.c.action();
        } else {
          console.log("🎯 Command palette: Cannot create issue in capture phase - missing permission or shortcut");
        }
      } else if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        console.log("🎯 Command palette: Blocking Cmd+J in capture phase");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    
    // Listen for the custom event from the global script
    const customEventHandler = (e: CustomEvent) => {
      console.log("🎯 Command palette: Received custom Cmd+N event", e.detail);
      
      // Check if we can create work items and trigger the action
      const hasPermission = (!projectId && performAnyProjectCreateActions(false)) || performProjectCreateActions(false);
      console.log("🎯 Command palette: Permission check result for custom event", { hasPermission });
      
      if (
        Object.keys(shortcutsList.global).includes("c") &&
        hasPermission
      ) {
        console.log("🎯 Command palette: Triggering create issue modal via custom event");
        shortcutsList.global.c.action();
      } else {
        console.log("🎯 Command palette: Cannot create issue via custom event - missing permission or shortcut");
      }
    };
    
    // Add multiple listeners with different priorities
    window.addEventListener("keydown", testHandler, { capture: true, passive: false });
    window.addEventListener("keydown", globalHandler, { capture: true, passive: false });
    document.addEventListener("keydown", captureHandler, { capture: true, passive: false });
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("plane:open-new-issue", customEventHandler as EventListener);
    
    return () => {
      console.log("🎯 Command palette: Removing keydown event listener");
      window.removeEventListener("keydown", testHandler, { capture: true });
      window.removeEventListener("keydown", globalHandler, { capture: true });
      document.removeEventListener("keydown", captureHandler, { capture: true });
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("plane:open-new-issue", customEventHandler as EventListener);
    };
  }, [handleKeyDown, projectId, shortcutsList, performAnyProjectCreateActions, performProjectCreateActions, isAnyModalOpen]);

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
