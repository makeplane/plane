/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export type TPageOperations = {
  attach: (pageIds: string[]) => Promise<void>;
  detach: (pageId: string) => Promise<void>;
};

export const usePageOperations = (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  issueServiceType: TIssueServiceType
): TPageOperations => {
  const { attachPage, detachPage } = useIssueDetail(issueServiceType);
  // i18n
  const { t } = useTranslation();

  const handlePageOperations: TPageOperations = useMemo(
    () => ({
      attach: async (pageIds: string[]) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await Promise.all(pageIds.map((pageId) => attachPage(workspaceSlug, projectId, issueId, pageId)));
          setToast({
            message: t("issue.pages.toasts.link.success.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("issue.pages.toasts.link.success.title"),
          });
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? t("issue.pages.toasts.link.error.message"),
            type: TOAST_TYPE.ERROR,
            title: t("issue.pages.toasts.link.error.title"),
          });
          throw error;
        }
      },
      detach: async (pageId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await detachPage(workspaceSlug, projectId, issueId, pageId);
          setToast({
            message: t("issue.pages.toasts.remove.success.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("issue.pages.toasts.remove.success.title"),
          });
        } catch {
          setToast({
            message: t("issue.pages.toasts.remove.error.message"),
            type: TOAST_TYPE.ERROR,
            title: t("issue.pages.toasts.remove.error.title"),
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, attachPage, detachPage, t]
  );

  return handlePageOperations;
};
