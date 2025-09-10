import { useEffect, useCallback } from "react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";
// types
import type { TIssueOperations } from "@/components/issues/issue-detail/root";

interface IUseIssueDetailShortcuts {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
}

export const useIssueDetailShortcuts = ({
  workspaceSlug,
  projectId,
  issueId,
  issueOperations,
}: IUseIssueDetailShortcuts) => {
  const { data: currentUser } = useUser();
  const { toggleDeleteIssueModal, isAnyModalOpen } = useCommandPalette();

  const assignToMe = useCallback(() => {
    if (!currentUser) return;
    issueOperations.update(workspaceSlug, projectId, issueId, {
      assignee_ids: [currentUser.id],
    });
  }, [currentUser, issueOperations, workspaceSlug, projectId, issueId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        isAnyModalOpen ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.closest(".ProseMirror")
      )
        return;

      const key = e.key.toLowerCase();
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      const shift = e.shiftKey;

      const clickByClass = (className: string) => {
        const el = document.querySelector(`.${className}`) as HTMLElement | null;
        el?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      };

      if (cmdOrCtrl && key === "delete") {
        e.preventDefault();
        toggleDeleteIssueModal(true);
        return;
      }

      if (cmdOrCtrl && key === "m") {
        e.preventDefault();
        const editor = document.querySelector(`#add_comment_${issueId} .ProseMirror`) as HTMLElement | null;
        editor?.focus();
        return;
      }

      if (cmdOrCtrl && shift && key === "d") {
        e.preventDefault();
        issueOperations.update(workspaceSlug, projectId, issueId, { target_date: null });
        return;
      }

      if (shift && key === "d") {
        e.preventDefault();
        clickByClass("js-issue-due-date");
        return;
      }

      if (shift && key === "e") {
        e.preventDefault();
        clickByClass("js-issue-estimate");
        return;
      }

      if (shift && key === "c") {
        e.preventDefault();
        clickByClass("js-issue-cycle");
        return;
      }

      if (shift && key === "m") {
        e.preventDefault();
        clickByClass("js-issue-module");
        return;
      }

      if (key === "a") {
        e.preventDefault();
        clickByClass("js-issue-assignee");
        return;
      }

      if (key === "i") {
        e.preventDefault();
        assignToMe();
        return;
      }

      if (key === "s") {
        e.preventDefault();
        clickByClass("js-issue-state");
        return;
      }

      if (key === "p") {
        e.preventDefault();
        clickByClass("js-issue-priority");
        return;
      }

      if (key === "l") {
        e.preventDefault();
        clickByClass("js-issue-label");
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    assignToMe,
    issueOperations,
    workspaceSlug,
    projectId,
    issueId,
    toggleDeleteIssueModal,
    isAnyModalOpen,
  ]);
};

