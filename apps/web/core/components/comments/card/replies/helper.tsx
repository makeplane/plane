/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCommentReplyOperations } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { useQuickActionsFactory } from "@/components/common/quick-actions/factory";

export const useCommentRepliesOperations = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  issueId: string | undefined
): TCommentReplyOperations | undefined => {
  // store hooks
  const { comment } = useIssueDetail();
  const repliesStore = comment.replies;
  // translation
  const { t } = useTranslation();

  const operations: TCommentReplyOperations | undefined = useMemo(() => {
    if (!repliesStore) return;

    const ops: TCommentReplyOperations = {
      fetchReplies: async (commentId) => {
        try {
          if (!workspaceSlug || !projectId || !issueId || !commentId) throw new Error("Missing fields");
          await repliesStore.fetchReplies(workspaceSlug, projectId, issueId, commentId);
        } catch (error) {
          console.error("Error fetching replies:", error);
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.replies.toast.fetch.error.message"),
          });
        }
      },
      createReply: async (commentId, data) => {
        try {
          if (!workspaceSlug || !projectId || !issueId || !commentId) throw new Error("Missing fields");
          const reply = await repliesStore.createReply(workspaceSlug, projectId, issueId, commentId, data);
          setToast({
            title: t("common.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.replies.toast.create.success.message"),
          });
          return reply;
        } catch (error) {
          console.error("Error creating reply:", error);
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.replies.toast.create.error.message"),
          });
          return undefined;
        }
      },
      updateReply: async (replyId, data) => {
        try {
          if (!workspaceSlug || !projectId || !issueId || !replyId) throw new Error("Missing fields");
          await repliesStore.updateReply(workspaceSlug, projectId, issueId, replyId, data);
          setToast({
            title: t("common.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.replies.toast.update.success.message"),
          });
        } catch (error) {
          console.error("Error updating reply:", error);
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.replies.toast.update.error.message"),
          });
        }
      },
      deleteReply: async (replyId) => {
        try {
          if (!workspaceSlug || !projectId || !issueId || !replyId) throw new Error("Missing fields");
          await repliesStore.deleteReply(workspaceSlug, projectId, issueId, replyId);
          setToast({
            title: t("common.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("issue.comments.replies.toast.delete.success.message"),
          });
        } catch (error) {
          console.error("Error deleting reply:", error);
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("issue.comments.replies.toast.delete.error.message"),
          });
        }
      },
    };

    return ops;
  }, [workspaceSlug, projectId, issueId, repliesStore, t]);

  return operations;
};

interface UseReplyMenuItemsProps {
  reply: {
    id: string;
    actor: string;
  };
  isAuthor: boolean;
  handleEdit: () => void;
  handleDelete: () => void;
}

export const useReplyMenuItems = (props: UseReplyMenuItemsProps): TContextMenuItem[] => {
  const factory = useQuickActionsFactory();
  const { isAuthor, handleEdit, handleDelete } = props;

  const items = [
    factory.createReplyEditMenuItem(handleEdit, isAuthor),
    factory.createReplyDeleteMenuItem(handleDelete, isAuthor),
  ].filter((item) => item.shouldRender !== false);

  return items;
};
