/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// components
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import { IssueParentSiblingItem } from "./sibling-item";

export type TIssueParentSiblings = {
  workspaceSlug: string;
  currentIssue: TIssue;
  parentIssue: TIssue;
};

export const IssueParentSiblings = observer(function IssueParentSiblings(props: TIssueParentSiblings) {
  const { workspaceSlug, currentIssue, parentIssue } = props;
  const { t } = useTranslation();
  // hooks
  const {
    fetchSubIssues,
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail();

  const { isLoading } = useSWR(
    parentIssue && parentIssue.project_id
      ? `ISSUE_PARENT_CHILD_ISSUES_${workspaceSlug}_${parentIssue.project_id}_${parentIssue.id}`
      : null,
    parentIssue && parentIssue.project_id
      ? () => fetchSubIssues(workspaceSlug, parentIssue.project_id!, parentIssue.id)
      : null
  );

  const subIssueIds = (parentIssue && subIssuesByIssueId(parentIssue.id)) || undefined;

  return (
    <div className="my-1">
      {isLoading ? (
        <div className="flex items-center gap-2 px-1 py-1 text-left text-11 whitespace-nowrap text-secondary">
          Loading
        </div>
      ) : subIssueIds && subIssueIds.length > 0 ? (
        subIssueIds.map(
          (issueId) =>
            currentIssue.id != issueId && (
              <IssueParentSiblingItem key={issueId} workspaceSlug={workspaceSlug} issueId={issueId} />
            )
        )
      ) : (
        <div className="flex items-center gap-2 px-1 py-1 text-left text-11 whitespace-nowrap text-secondary">
          {t("issue_ui.no_siblings")}
        </div>
      )}
    </div>
  );
});
