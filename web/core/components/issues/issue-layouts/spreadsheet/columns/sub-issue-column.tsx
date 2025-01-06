import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { TIssue } from "@plane/types";
// helpers
import { Row } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  issue: TIssue;
};

export const SpreadsheetSubIssueColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;
  // router
  const router = useAppRouter();
  // hooks
  const { workspaceSlug } = useParams();
  const { getIssueTypeById } = useIssueTypes();
  // derived values
  const issueTypeDetails = issue.type_id ? getIssueTypeById(issue.type_id) : undefined;
  const isEpic = issueTypeDetails?.is_epic;
  const subIssueCount = issue?.sub_issues_count ?? 0;

  const redirectToIssueDetail = () => {
    router.push(
      `/${workspaceSlug?.toString()}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}${isEpic ? "epics" : "issues"}/${issue.id}#sub-issues`
    );
  };

  const issueLabel = isEpic ? "issue" : "sub-issue";
  const label = `${subIssueCount} ${issueLabel}${subIssueCount !== 1 ? "s" : ""}`;

  return (
    <Row
      onClick={subIssueCount ? redirectToIssueDetail : () => {}}
      className={cn(
        "flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 py-1 text-xs hover:bg-custom-background-80 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10",
        {
          "cursor-pointer": subIssueCount,
        }
      )}
    >
      {label}
    </Row>
  );
});
