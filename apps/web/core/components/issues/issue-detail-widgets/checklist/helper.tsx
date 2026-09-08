/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueChecklistItem, TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export type TChecklistOperations = {
  create: (data: Partial<TIssueChecklistItem>) => Promise<void>;
  update: (checklistItemId: string, data: Partial<TIssueChecklistItem>) => Promise<void>;
  // Status changes are the highest-frequency operation on a checklist — a
  // toast per change is unusable, so this surfaces only errors (unlike
  // create/update/remove below, which confirm success too).
  setStatus: (checklistItemId: string, status: TIssueChecklistItem["status"]) => Promise<void>;
  reorder: (checklistItemId: string, sortOrder: number) => Promise<void>;
  remove: (checklistItemId: string) => Promise<void>;
};

export const useChecklistOperations = (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  issueServiceType: TIssueServiceType
): TChecklistOperations => {
  const { createChecklistItem, updateChecklistItem, removeChecklistItem } = useIssueDetail(issueServiceType);
  // i18n
  const { t } = useTranslation();

  const checklistOperations: TChecklistOperations = useMemo(
    () => ({
      create: async (data: Partial<TIssueChecklistItem>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await createChecklistItem(workspaceSlug, projectId, issueId, data);
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? t("checklist.toasts.not_created.message"),
            type: TOAST_TYPE.ERROR,
            title: t("checklist.toasts.not_created.title"),
          });
          throw error;
        }
      },
      update: async (checklistItemId: string, data: Partial<TIssueChecklistItem>) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await updateChecklistItem(workspaceSlug, projectId, issueId, checklistItemId, data);
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? t("checklist.toasts.not_updated.message"),
            type: TOAST_TYPE.ERROR,
            title: t("checklist.toasts.not_updated.title"),
          });
          throw error;
        }
      },
      setStatus: async (checklistItemId: string, status: TIssueChecklistItem["status"]) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await updateChecklistItem(workspaceSlug, projectId, issueId, checklistItemId, { status });
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? t("checklist.toasts.not_updated.message"),
            type: TOAST_TYPE.ERROR,
            title: t("checklist.toasts.not_updated.title"),
          });
          throw error;
        }
      },
      reorder: async (checklistItemId: string, sortOrder: number) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await updateChecklistItem(workspaceSlug, projectId, issueId, checklistItemId, { sort_order: sortOrder });
        } catch {
          setToast({
            message: t("checklist.toasts.not_updated.message"),
            type: TOAST_TYPE.ERROR,
            title: t("checklist.toasts.not_updated.title"),
          });
        }
      },
      remove: async (checklistItemId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await removeChecklistItem(workspaceSlug, projectId, issueId, checklistItemId);
          setToast({
            message: t("checklist.toasts.removed.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("checklist.toasts.removed.title"),
          });
        } catch {
          setToast({
            message: t("checklist.toasts.not_removed.message"),
            type: TOAST_TYPE.ERROR,
            title: t("checklist.toasts.not_removed.title"),
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, createChecklistItem, updateChecklistItem, removeChecklistItem, t]
  );

  return checklistOperations;
};
