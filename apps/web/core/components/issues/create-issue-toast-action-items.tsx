/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { useTranslation } from "@plane/i18n";
import type { ToastActionItem } from "@plane/blocks/toast";
import { copyTextToClipboard, copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";

type TCreateIssueToastActionArgs = {
  workspaceSlug: string;
  issueId: string;
};

/**
 * propel: Propel's toast is a closed, portaled surface with no markup escape hatch, so its actions
 * cross the boundary as data (`{ label, onClick | href }`) — a component here would be dropped at
 * runtime. This hook keeps the store reads (the work item is only in the store once the create
 * settles) and hands the call site a builder it can invoke inside `setToast`.
 */
export function useCreateIssueToastActions() {
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();

  return useCallback(
    ({ workspaceSlug, issueId }: TCreateIssueToastActionArgs): ToastActionItem[] => {
      const issue = getIssueById(issueId);
      if (!issue) return [];

      const projectIdentifier = getProjectIdentifierById(issue.project_id);
      const hasIdentifier = !!(projectIdentifier && issue.sequence_id);
      if (!hasIdentifier) return [];

      const identifier = `${projectIdentifier}-${issue.sequence_id}`;
      const workItemLink = generateWorkItemLink({
        workspaceSlug,
        projectId: issue.project_id,
        issueId,
        projectIdentifier,
        sequenceId: issue.sequence_id,
      });
      if (!workItemLink) return [];

      // Propel renders two left actions plus one right-aligned `primary`, so all three fit: view
      // takes the primary slot (it is the call to action on a success toast) and the two copy
      // affordances the old markup offered stay in the left cluster.
      return [
        {
          label: t("common.actions.copy_link"),
          onClick: () => {
            void copyUrlToClipboard(workItemLink);
          },
        },
        {
          label: identifier,
          onClick: () => {
            void copyTextToClipboard(identifier);
          },
        },
        { label: t("common.view"), href: workItemLink, target: "_blank", primary: true },
      ];
    },
    [t, getIssueById, getProjectIdentifierById]
  );
}
