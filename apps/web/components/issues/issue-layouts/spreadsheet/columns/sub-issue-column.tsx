/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// helpers
import { Row } from "@plane/blocks/layout";
import { cn } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  issue: TIssue;
};

export const SpreadsheetSubIssueColumn = observer(function SpreadsheetSubIssueColumn(props: Props) {
  const { issue } = props;
  // plane hooks
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  // hooks
  const { workspaceSlug } = useParams();
  // derived values
  const isEpic = issue?.is_epic;
  const subIssueCount = issue?.sub_issues_count ?? 0;

  const redirectToIssueDetail = () => {
    router.push(
      `/${workspaceSlug?.toString()}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}${isEpic ? "epics" : "issues"}/${issue.id}#sub-issues`
    );
  };

  const label = t("issue.sub_work_item_count", { count: subIssueCount });

  return (
    <Row
      onClick={subIssueCount ? redirectToIssueDetail : () => {}}
      className={cn(
        "flex h-11 w-full items-center border-b-[0.5px] border-subtle py-1 group-[.selected-issue-row]:bg-accent-primary/5 hover:bg-layer-transparent-hover group-[.selected-issue-row]:hover:bg-accent-primary/10",
        {
          "cursor-pointer": subIssueCount,
        }
      )}
    >
      {isEpic ? null : label}
    </Row>
  );
});
