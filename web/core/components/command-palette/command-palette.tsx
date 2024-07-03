"use client";

import React, { useCallback, useEffect, FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { CommandModal, ShortcutsModal } from "@/components/command-palette";
import { BulkDeleteIssuesModal } from "@/components/core";
import { CycleCreateUpdateModal } from "@/components/cycles";
import { CreateUpdateIssueModal, DeleteIssueModal } from "@/components/issues";
import { CreateUpdateModuleModal } from "@/components/modules";
import { CreatePageModal } from "@/components/pages";
import { CreateProjectModal } from "@/components/project";
import { CreateUpdateProjectViewModal } from "@/components/views";
// constants
import { ISSUE_DETAILS } from "@/constants/fetch-keys";
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssues, useUser, useAppTheme, useCommandPalette } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { IssueService } from "@/services/issue";

// services
const issueService = new IssueService();

export const CommandPalette: FC = observer(() => {
  // router
  const router = useAppRouter();
  // router params
  const { workspaceSlug, projectId, issueId, cycleId, moduleId } = useParams();
  // pathname
  const pathname = usePathname();
  // store hooks
  const { toggleSidebar } = useAppTheme();
  const { setTrackElement } = useEventTracker();
  const { platform } = usePlatformOS();
  const {
    membership: { currentWorkspaceRole, currentProjectRole },
    data: currentUser,
  } = useUser();
  const {
    issues: { removeIssue },
  } = useIssues(EIssuesStoreType.PROJECT);
  const {
    toggleCommandPaletteModal,
    isCreateIssueModalOpen,
    toggleCreateIssueModal,
    isCreateCycleModalOpen,
    toggleCreateCycleModal,
    createPageModal,
    toggleCreatePageModal,
    isCreateProjectModalOpen,
    toggleCreateProjectModal,
    isCreateModuleModalOpen,
    toggleCreateModuleModal,
    isCreateViewModalOpen,
    toggleCreateViewModal,
    isShortcutModalOpen,
    toggleShortcutModal,
    isBulkDeleteIssueModalOpen,
    toggleBulkDeleteIssueModal,
    isDeleteIssueModalOpen,
    toggleDeleteIssueModal,
    isAnyModalOpen,
    createIssueStoreType,
  } = useCommandPalette();

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

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
  const canPerformProjectCreateActions = useCallback(
    (showToast: boolean = true) => {
      const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
      if (!isAllowed && showToast)
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "You don't have permission to perform this action.",
        });

      return isAllowed;
    },
    [currentProjectRole]
  );
  const canPerformWorkspaceCreateActions = useCallback(
    (showToast: boolean = true) => {
      const isAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;
      if (!isAllowed && showToast)
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "You don't have permission to perform this action.",
        });
      return isAllowed;
    },
    [currentWorkspaceRole]
  );

  const shortcutsList: {
    global: Record<string, { title: string; description: string; action: () => void }>;
    workspace: Record<string, { title: string; description: string; action: () => void }>;
    project: Record<string, { title: string; description: string; action: () => void }>;
  } = useMemo(
    () => ({
      global: {
        c: {
          title: "Create a new issue",
          description: "Create a new issue in the current project",
          action: () => toggleCreateIssueModal(true),
        },
      },
      workspace: {
        p: {
          title: "Create a new project",
          description: "Create a new project in the current workspace",
          action: () => toggleCreateProjectModal(true),
        },
      },
      project: {
        d: {
          title: "Create a new page",
          description: "Create a new page in the current project",
          action: () => toggleCreatePageModal({ isOpen: true }),
        },
        m: {
          title: "Create a new module",
          description: "Create a new module in the current project",
          action: () => toggleCreateModuleModal(true),
        },
        q: {
          title: "Create a new cycle",
          description: "Create a new cycle in the current project",
          action: () => toggleCreateCycleModal(true),
        },
        v: {
          title: "Create a new view",
          description: "Create a new view in the current project",
          action: () => toggleCreateViewModal(true),
        },
        backspace: {
          title: "Bulk delete issues",
          description: "Bulk delete issues in the current project",
          action: () => toggleBulkDeleteIssueModal(true),
        },
        delete: {
          title: "Bulk delete issues",
          description: "Bulk delete issues in the current project",
          action: () => toggleBulkDeleteIssueModal(true),
        },
      },
    }),
    [
      toggleBulkDeleteIssueModal,
      toggleCreateCycleModal,
      toggleCreateIssueModal,
      toggleCreateModuleModal,
      toggleCreatePageModal,
      toggleCreateProjectModal,
      toggleCreateViewModal,
      toggleShortcutModal,
    ]
  );

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

      if (cmdClicked) {
        if (keyPressed === "c" && ((platform === "MacOS" && ctrlKey) || altKey)) {
          e.preventDefault();
          copyIssueUrlToClipboard();
        } else if (keyPressed === "b") {
          e.preventDefault();
          toggleSidebar();
        }
      } else if (!isAnyModalOpen) {
        setTrackElement("Shortcut key");
        if (Object.keys(shortcutsList.global).includes(keyPressed)) shortcutsList.global[keyPressed].action();
        // workspace authorized actions
        else if (
          Object.keys(shortcutsList.workspace).includes(keyPressed) &&
          workspaceSlug &&
          canPerformWorkspaceCreateActions()
        )
          shortcutsList.workspace[keyPressed].action();
        // project authorized actions
        else if (
          Object.keys(shortcutsList.project).includes(keyPressed) &&
          projectId &&
          canPerformProjectCreateActions()
        ) {
          e.preventDefault();
          // actions that can be performed only inside a project
          shortcutsList.project[keyPressed].action();
        }
      }
    },
    [
      canPerformProjectCreateActions,
      canPerformWorkspaceCreateActions,
      copyIssueUrlToClipboard,
      isAnyModalOpen,
      projectId,
      setTrackElement,
      shortcutsList,
      toggleCommandPaletteModal,
      toggleSidebar,
      workspaceSlug,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const isDraftIssue = pathname?.includes("draft-issues") || false;

  if (!currentUser) return null;

  return (
    <>
      <ShortcutsModal isOpen={isShortcutModalOpen} onClose={() => toggleShortcutModal(false)} />
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => toggleCreateProjectModal(false)}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      {workspaceSlug && projectId && (
        <>
          <CycleCreateUpdateModal
            isOpen={isCreateCycleModalOpen}
            handleClose={() => toggleCreateCycleModal(false)}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />
          <CreateUpdateModuleModal
            isOpen={isCreateModuleModalOpen}
            onClose={() => toggleCreateModuleModal(false)}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />
          <CreateUpdateProjectViewModal
            isOpen={isCreateViewModalOpen}
            onClose={() => toggleCreateViewModal(false)}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />
          <CreatePageModal
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            isModalOpen={createPageModal.isOpen}
            pageAccess={createPageModal.pageAccess}
            handleModalClose={() => toggleCreatePageModal({ isOpen: false })}
            redirectionEnabled
          />
        </>
      )}

      <CreateUpdateIssueModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => toggleCreateIssueModal(false)}
        data={cycleId ? { cycle_id: cycleId.toString() } : moduleId ? { module_ids: [moduleId.toString()] } : undefined}
        storeType={createIssueStoreType}
        isDraft={isDraftIssue}
      />

      {workspaceSlug && projectId && issueId && issueDetails && (
        <DeleteIssueModal
          handleClose={() => toggleDeleteIssueModal(false)}
          isOpen={isDeleteIssueModalOpen}
          data={issueDetails}
          onSubmit={async () => {
            await removeIssue(workspaceSlug.toString(), projectId.toString(), issueId.toString());
            router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
          }}
        />
      )}

      <BulkDeleteIssuesModal
        isOpen={isBulkDeleteIssueModalOpen}
        onClose={() => toggleBulkDeleteIssueModal(false)}
        user={currentUser}
      />
      <CommandModal />
    </>
  );
});
