import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// components
import { CommandK, ShortcutsModal } from "components/command-palette";
import { BulkDeleteIssuesModal } from "components/core";
import { CreateUpdateCycleModal } from "components/cycles";
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
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

// services
const issueService = new IssueService();

export const CommandPalette: React.FC = observer(() => {
  const store: any = useMobxStore();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [isBulkDeleteIssuesModalOpen, setIsBulkDeleteIssuesModalOpen] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [isCreateUpdatePageModalOpen, setIsCreateUpdatePageModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId, inboxId, cycleId, moduleId } = router.query;

  const { user } = useUser();

  const { setToastAlert } = useToast();

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const copyIssueUrlToClipboard = useCallback(() => {
    if (!router.query.issueId) return;

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
  }, [router, setToastAlert]);

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
          setIsPaletteOpen(true);
        } else if (keyPressed === "c" && altKey) {
          e.preventDefault();
          copyIssueUrlToClipboard();
        } else if (keyPressed === "b") {
          e.preventDefault();
          store.theme.setSidebarCollapsed(!store?.theme?.sidebarCollapsed);
        }
      } else {
        if (keyPressed === "c") {
          setIsIssueModalOpen(true);
        } else if (keyPressed === "p") {
          setIsProjectModalOpen(true);
        } else if (keyPressed === "v") {
          setIsCreateViewModalOpen(true);
        } else if (keyPressed === "d") {
          setIsCreateUpdatePageModalOpen(true);
        } else if (keyPressed === "h") {
          setIsShortcutsModalOpen(true);
        } else if (keyPressed === "q") {
          setIsCreateCycleModalOpen(true);
        } else if (keyPressed === "m") {
          setIsCreateModuleModalOpen(true);
        } else if (keyPressed === "backspace" || keyPressed === "delete") {
          e.preventDefault();
          setIsBulkDeleteIssuesModalOpen(true);
        }
      }
    },
    [copyIssueUrlToClipboard, store.theme]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!user) return null;

  const deleteIssue = () => {
    setIsPaletteOpen(false);
    setDeleteIssueModal(true);
  };

  return (
    <>
      <ShortcutsModal isOpen={isShortcutsModalOpen} setIsOpen={setIsShortcutsModalOpen} />
      {workspaceSlug && (
        <CreateProjectModal isOpen={isProjectModalOpen} setIsOpen={setIsProjectModalOpen} user={user} />
      )}
      {projectId && (
        <>
          <CreateUpdateCycleModal
            isOpen={isCreateCycleModalOpen}
            handleClose={() => setIsCreateCycleModalOpen(false)}
            user={user}
          />
          <CreateUpdateModuleModal
            isOpen={isCreateModuleModalOpen}
            setIsOpen={setIsCreateModuleModalOpen}
            user={user}
          />
          <CreateUpdateProjectViewModal
            isOpen={isCreateViewModalOpen}
            onClose={() => setIsCreateViewModalOpen(false)}
          />
          <CreateUpdatePageModal
            isOpen={isCreateUpdatePageModalOpen}
            handleClose={() => setIsCreateUpdatePageModalOpen(false)}
            user={user}
          />
        </>
      )}
      {issueId && issueDetails && (
        <DeleteIssueModal
          handleClose={() => setDeleteIssueModal(false)}
          isOpen={deleteIssueModal}
          data={issueDetails}
          user={user}
        />
      )}
      <CreateUpdateIssueModal
        isOpen={isIssueModalOpen}
        handleClose={() => setIsIssueModalOpen(false)}
        fieldsToShow={inboxId ? ["name", "description", "priority"] : ["all"]}
        prePopulateData={
          cycleId ? { cycle: cycleId.toString() } : moduleId ? { module: moduleId.toString() } : undefined
        }
      />
      <BulkDeleteIssuesModal
        isOpen={isBulkDeleteIssuesModalOpen}
        setIsOpen={setIsBulkDeleteIssuesModalOpen}
        user={user}
      />
      <CommandK deleteIssue={deleteIssue} isPaletteOpen={isPaletteOpen} setIsPaletteOpen={setIsPaletteOpen} />
    </>
  );
});
