/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// workspaces imports
import { useTranslation } from "@workspaces/i18n";
import { TOAST_TYPE, setToast } from "@workspaces/propel/toast";
import type { TIssue, TIssueServiceType } from "@workspaces/types";
import { EIssueServiceType } from "@workspaces/types";
import { copyUrlToClipboard } from "@workspaces/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export type TRelationIssueOperations = {
  copyLink: (path: string) => void;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

export const useRelationOperations = (
  issueServiceType: TIssueServiceType = EIssueServiceType.ISSUES
): TRelationIssueOperations => {
  const { updateIssue, removeIssue } = useIssueDetail(issueServiceType);
  const { t } = useTranslation();
  // derived values
  const entityName = issueServiceType === EIssueServiceType.ISSUES ? "Work item" : "Epic";

  const issueOperations: TRelationIssueOperations = useMemo(
    () => ({
      copyLink: async (path) => {
        await copyUrlToClipboard(path);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.link_copied"),
          message: t("entity.link_copied_to_clipboard", { entity: entityName }),
        });
      },
      update: async (workspaceSlug, projectId, issueId, data) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          setToast({
            title: t("toast.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("entity.update.success", { entity: entityName }),
          });
        } catch (_error) {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.update.failed", { entity: entityName }),
          });
        }
      },
      remove: async (workspaceSlug, projectId, issueId) => {
        return removeIssue(workspaceSlug, projectId, issueId);
      },
    }),
    [entityName, removeIssue, t, updateIssue]
  );

  return issueOperations;
};
