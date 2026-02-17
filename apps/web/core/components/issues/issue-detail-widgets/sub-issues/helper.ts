/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType, TSubIssueOperations } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { copyUrlToClipboard } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export const useSubIssueOperations = (issueServiceType: TIssueServiceType): TSubIssueOperations => {
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    subIssues: { setSubIssueHelpers },
    createSubIssues,
    fetchSubIssues,
    updateSubIssue,
    deleteSubIssue,
    removeSubIssue,
  } = useIssueDetail(issueServiceType);

  const subIssueOperations: TSubIssueOperations = useMemo(
    () => ({
      copyLink: async (path) => {
        await copyUrlToClipboard(path);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.link_copied"),
          message: t("entity.link_copied_to_clipboard", {
            entity:
              issueServiceType === EIssueServiceType.ISSUES
                ? t("common.sub_work_items", { count: 1 })
                : t("issue.label", { count: 1 }),
          }),
        });
      },
      fetchSubIssues: async (workspaceSlug, projectId, parentIssueId) => {
        try {
          await fetchSubIssues(workspaceSlug, projectId, parentIssueId);
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("entity.fetch.failed", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items", { count: 2 })
                  : t("issue.label", { count: 2 }),
            }),
          });
        }
      },
      addSubIssue: async (workspaceSlug, projectId, parentIssueId, issueIds) => {
        try {
          await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("entity.add.success", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items")
                  : t("issue.label", { count: issueIds.length }),
            }),
          });
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("entity.add.failed", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items")
                  : t("issue.label", { count: issueIds.length }),
            }),
          });
        }
      },
      updateSubIssue: async (
        workspaceSlug,
        projectId,
        parentIssueId,
        issueId,
        issueData,
        oldIssue = {},
        fromModal = false
      ) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await updateSubIssue(workspaceSlug, projectId, parentIssueId, issueId, issueData, oldIssue, fromModal);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("sub_work_item.update.success"),
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("sub_work_item.update.error"),
          });
        }
      },
      removeSubIssue: async (workspaceSlug, projectId, parentIssueId, issueId) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await removeSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("entity.remove.success", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items")
                  : t("issue.label", { count: 1 }),
            }),
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("entity.remove.failed", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items")
                  : t("issue.label", { count: 1 }),
            }),
          });
        }
      },
      deleteSubIssue: async (workspaceSlug, projectId, parentIssueId, issueId) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await deleteSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("entity.delete.failed", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items")
                  : t("issue.label", { count: 1 }),
            }),
          });
        }
      },
    }),
    [
      createSubIssues,
      deleteSubIssue,
      fetchSubIssues,
      issueServiceType,
      removeSubIssue,
      setSubIssueHelpers,
      t,
      updateSubIssue,
    ]
  );

  return subIssueOperations;
};
