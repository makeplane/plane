import React, { useCallback, useEffect, FC } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useIssues, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { CommandModal, ShortcutsModal } from "components/command-palette";
import { BulkDeleteIssuesModal } from "components/core";
import { CycleCreateUpdateModal } from "components/cycles";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { CreateUpdateModuleModal } from "components/modules";
import { CreateProjectModal } from "components/project";
import { CreateUpdateProjectViewModal } from "components/views";
import { CreateUpdatePageModal } from "components/pages";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// services
import { IssueService } from "services/issue";
// fetch keys
import { ISSUE_DETAILS } from "constants/fetch-keys";
import { EIssuesStoreType } from "constants/issue";

// services
const issueService = new IssueService();

export const CommandPalette: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId, cycleId, moduleId } = router.query;

  const {
    commandPalette,
    theme: { toggleSidebar },
    eventTracker: { setTrackElement },
  } = useApplication();
  const { currentUser } = useUser();
  const {
    issues: { removeIssue },
  } = useIssues(EIssuesStoreType.PROJECT);

  const {
    toggleCommandPaletteModal,
    isCreateIssueModalOpen,
    toggleCreateIssueModal,
    isCreateCycleModalOpen,
    toggleCreateCycleModal,
    isCreatePageModalOpen,
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
  } = commandPalette;

  const { setToastAlert } = useToast();

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
        setToastAlert({
          type: "success",
          title: "Copied to clipboard",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Some error occurred",
        });
      });
  }, [setToastAlert, issueId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey } = e;
      if (!key) return;

      const keyPressed = key.toLowerCase();
      const cmdClicked = ctrlKey || metaKey;
      // if on input, textarea or editor, don't do anything
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement ||
        (e.target as Element).classList?.contains("ProseMirror")
      )
        return;

      if (cmdClicked) {
        if (keyPressed === "k") {
          e.preventDefault();
          toggleCommandPaletteModal(true);
        } else if (keyPressed === "c" && altKey) {
          e.preventDefault();
          copyIssueUrlToClipboard();
        } else if (keyPressed === "b") {
          e.preventDefault();
          toggleSidebar();
        }
      } else if (!isAnyModalOpen) {
        if (keyPressed === "c") {
          setTrackElement("SHORTCUT_KEY");
          toggleCreateIssueModal(true);
        } else if (keyPressed === "p") {
          setTrackElement("SHORTCUT_KEY");
          toggleCreateProjectModal(true);
        } else if (keyPressed === "h") {
          toggleShortcutModal(true);
        } else if (keyPressed === "v" && workspaceSlug && projectId) {
          toggleCreateViewModal(true);
        } else if (keyPressed === "d" && workspaceSlug && projectId) {
          toggleCreatePageModal(true);
        } else if (keyPressed === "q" && workspaceSlug && projectId) {
          toggleCreateCycleModal(true);
        } else if (keyPressed === "m" && workspaceSlug && projectId) {
          toggleCreateModuleModal(true);
        } else if (keyPressed === "backspace" || keyPressed === "delete") {
          e.preventDefault();
          toggleBulkDeleteIssueModal(true);
        }
      }
    },
    [
      copyIssueUrlToClipboard,
      toggleCreateProjectModal,
      toggleCreateViewModal,
      toggleCreatePageModal,
      toggleShortcutModal,
      toggleCreateCycleModal,
      toggleCreateModuleModal,
      toggleBulkDeleteIssueModal,
      toggleCommandPaletteModal,
      toggleSidebar,
      toggleCreateIssueModal,
      projectId,
      workspaceSlug,
      isAnyModalOpen,
      setTrackElement,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentUser) return null;

  return (
    <>
      <ShortcutsModal
        isOpen={isShortcutModalOpen}
        onClose={() => {
          toggleShortcutModal(false);
        }}
      />
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => {
            toggleCreateProjectModal(false);
          }}
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
            onClose={() => {
              toggleCreateModuleModal(false);
            }}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />
          <CreateUpdateProjectViewModal
            isOpen={isCreateViewModalOpen}
            onClose={() => toggleCreateViewModal(false)}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />
          <CreateUpdatePageModal
            isOpen={isCreatePageModalOpen}
            handleClose={() => toggleCreatePageModal(false)}
            projectId={projectId.toString()}
          />
        </>
      )}

      <CreateUpdateIssueModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => toggleCreateIssueModal(false)}
        data={cycleId ? { cycle_id: cycleId.toString() } : moduleId ? { module_ids: [moduleId.toString()] } : undefined}
        storeType={createIssueStoreType}
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
        onClose={() => {
          toggleBulkDeleteIssueModal(false);
        }}
        user={currentUser}
      />
      <CommandModal />
    </>
  );
});
