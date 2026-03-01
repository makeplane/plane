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

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import type { TIssue } from "@plane/types";
// helpers
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

import { IssueStats } from "@/components/issues/issue-layouts/issue-stats";
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  issue: TIssue;
};

export const SpreadsheetSubIssueColumn = observer(function SpreadsheetSubIssueColumn(props: Props) {
  const { issue } = props;
  // router
  const router = useAppRouter();
  // hooks
  const { workspaceSlug } = useParams();
  // derived values
  const isEpic = issue?.is_epic;

  const { getIssueTypeById } = useIssueTypes();
  // derived values
  const issueTypeDetails = issue.type_id ? getIssueTypeById(issue.type_id) : undefined;

  const subIssueCount = issue?.sub_issues_count ?? 0;

  const redirectToIssueDetail = () => {
    router.push(
      `/${workspaceSlug?.toString()}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}${isEpic ? "epics" : "issues"}/${issue.id}#sub-issues`
    );
  };

  const label = `${subIssueCount} sub-work item${subIssueCount !== 1 ? "s" : ""}`;
  const issueLabel = isEpic ? "work item" : "sub-work item";

  return (
    <Row
      onClick={subIssueCount ? redirectToIssueDetail : () => {}}
      className={cn(
        "flex h-11 w-full items-center border-b-[0.5px] border-subtle py-1 text-11 hover:bg-surface-2 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary",
        {
          "cursor-pointer": subIssueCount,
        }
      )}
    >
      {isEpic ? <IssueStats issueId={issue.id} /> : label}
    </Row>
  );
});
