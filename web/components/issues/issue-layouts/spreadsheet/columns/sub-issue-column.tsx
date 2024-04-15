import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { TIssue } from "@plane/types";
// hooks
import { cn } from "@/helpers/common.helper";
import { useApplication } from "@/hooks/store";
// types
// helpers

type Props = {
  issue: TIssue;
};

export const SpreadsheetSubIssueColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;
  // router
  const router = useRouter();
  // hooks
  const {
    router: { workspaceSlug },
  } = useApplication();

  const redirectToIssueDetail = () => {
    router.push({
      pathname: `/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}issues/${
        issue.id
      }`,
      hash: "sub-issues",
    });
  };

  return (
    <div
      onClick={issue?.sub_issues_count ? redirectToIssueDetail : () => {}}
      className={cn(
        "flex h-11 w-full items-center px-2.5 py-1 text-xs border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80",
        {
          "cursor-pointer": issue?.sub_issues_count,
        }
      )}
    >
      {issue?.sub_issues_count} {issue?.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
    </div>
  );
});
