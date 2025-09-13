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
    const stopEvent = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

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

      if (cmdOrCtrl && (key === "delete" || key === "backspace")) {
        stopEvent(e);
        toggleDeleteIssueModal(true);
        return;
      }

      if (cmdOrCtrl && key === "m") {
        stopEvent(e);
        const editor = document.querySelector(`#add_comment_${issueId} .ProseMirror`) as HTMLElement | null;
        editor?.focus();
        return;
      }

      if (cmdOrCtrl && shift && key === "d") {
        stopEvent(e);
        issueOperations.update(workspaceSlug, projectId, issueId, { target_date: null });
        return;
      }

      if (shift && key === "d") {
        stopEvent(e);
        clickByClass("js-issue-due-date");
        return;
      }

      if (shift && key === "e") {
        stopEvent(e);
        clickByClass("js-issue-estimate");
        return;
      }

      if (shift && key === "c") {
        stopEvent(e);
        clickByClass("js-issue-cycle");
        return;
      }

      if (shift && key === "m") {
        stopEvent(e);
        clickByClass("js-issue-module");
        return;
      }

      if (key === "a") {
        stopEvent(e);
        clickByClass("js-issue-assignee");
        return;
      }

      if (key === "i") {
        stopEvent(e);
        assignToMe();
        return;
      }

      if (key === "s") {
        stopEvent(e);
        clickByClass("js-issue-state");
        return;
      }

      if (key === "p") {
        stopEvent(e);
        clickByClass("js-issue-priority");
        return;
      }

      if (key === "l") {
        stopEvent(e);
        clickByClass("js-issue-label");
      }
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
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

