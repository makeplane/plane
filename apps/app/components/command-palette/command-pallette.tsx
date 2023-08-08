import React, { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// hooks
import useTheme from "hooks/use-theme";
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// components
import { CommandK, ShortcutsModal } from "components/command-palette";
import { BulkDeleteIssuesModal } from "components/core";
import { CreateUpdateCycleModal } from "components/cycles";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { CreateUpdateModuleModal } from "components/modules";
import { CreateProjectModal } from "components/project";
import { CreateUpdateViewModal } from "components/views";
import { CreateUpdatePageModal } from "components/pages";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// services
import issuesService from "services/issues.service";
import inboxService from "services/inbox.service";
// fetch keys
import { INBOX_LIST, ISSUE_DETAILS } from "constants/fetch-keys";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export const CommandPalette: React.FC = () => {
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
  const { workspaceSlug, projectId, issueId, inboxId } = router.query;

  const { user } = useUser();

  const { setToastAlert } = useToast();
  const { toggleCollapsed } = useTheme();

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
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
      const singleShortcutKeys = ["p", "v", "d", "h", "q", "m"];
      const { key, ctrlKey, metaKey, altKey, shiftKey } = e;
      if (!key) return;
      const keyPressed = key.toLowerCase();
      if (
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target as Element).classList?.contains("remirror-editor")
      ) {
        if ((ctrlKey || metaKey) && keyPressed === "k") {
          e.preventDefault();
          setIsPaletteOpen(true);
        } else if ((ctrlKey || metaKey) && keyPressed === "c") {
          if (altKey) {
            e.preventDefault();
            copyIssueUrlToClipboard();
          }
        } else if (keyPressed === "c") {
          e.preventDefault();
          setIsIssueModalOpen(true);
        } else if ((ctrlKey || metaKey) && keyPressed === "b") {
          e.preventDefault();
          // toggleCollapsed();
          store.theme.setSidebarCollapsed(!store?.theme?.sidebarCollapsed);
        } else if (key === "Delete") {
          e.preventDefault();
          setIsBulkDeleteIssuesModalOpen(true);
        } else if (
          singleShortcutKeys.includes(keyPressed) &&
          (ctrlKey || metaKey || altKey || shiftKey)
        ) {
          e.preventDefault();
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
        }
      }
    },
    [copyIssueUrlToClipboard]
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
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          setIsOpen={setIsProjectModalOpen}
          user={user}
        />
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
          <CreateUpdateViewModal
            handleClose={() => setIsCreateViewModalOpen(false)}
            isOpen={isCreateViewModalOpen}
            user={user}
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
      />
      <BulkDeleteIssuesModal
        isOpen={isBulkDeleteIssuesModalOpen}
        setIsOpen={setIsBulkDeleteIssuesModalOpen}
        user={user}
      />
      <CommandK
        deleteIssue={deleteIssue}
        isPaletteOpen={isPaletteOpen}
        setIsPaletteOpen={setIsPaletteOpen}
      />
    </>
  );
};
