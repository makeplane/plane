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
import { IssueStats } from "@/plane-web/components/issues/issue-layouts/issue-stats";

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
  const subIssueCount = issue?.sub_issues_count ?? 0;

  const redirectToIssueDetail = () => {
    router.push(
      `/${workspaceSlug?.toString()}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}${isEpic ? "epics" : "issues"}/${issue.id}#sub-issues`
    );
  };

  const label = `${subIssueCount} sub-work item${subIssueCount !== 1 ? "s" : ""}`;

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
