import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { TIssue } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppRouter } from "@/hooks/store";

type Props = {
  issue: TIssue;
};

export const SpreadsheetSubIssueColumn: React.FC<Props> = observer((props: Props) => {
  const { issue } = props;
  // router
  const router = useRouter();
  // hooks
  const { workspaceSlug } = useAppRouter();

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
        "flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 px-2.5 py-1 text-xs hover:bg-custom-background-80",
        {
          "cursor-pointer": issue?.sub_issues_count,
        }
      )}
    >
      {issue?.sub_issues_count} {issue?.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
    </div>
  );
});
