import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// helpers
import { SpreadsheetStoreType } from "@/components/issues/issue-layouts/spreadsheet/base-spreadsheet-root";
import { cn  } from "@plane/utils";
// hooks
import { useIssues } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { TProject } from "@/plane-web/types/projects";

type Props = {
  project: TProject;
};

export const SpreadsheetIssueColumn: React.FC<Props> = observer((props: Props) => {
  const { project } = props;
  // router
  const router = useAppRouter();
  // hooks
  const { workspaceSlug } = useParams();
  const storeType = useIssueStoreType() as SpreadsheetStoreType;

  const { issueMap } = useIssues(storeType);

  // derived values
  const issueCount = Object.keys(issueMap).length ?? 0;

  const redirectToIssueDetail = () => {
    router.push(`/${workspaceSlug?.toString()}/projects/${project.id}/issues`);
  };
  console.log("issueCount", issueCount);
  return (
    <div
      onClick={issueCount ? redirectToIssueDetail : () => {}}
      className={cn(
        "flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 px-4 py-1 text-xs hover:bg-custom-background-80 group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10",
        {
          "cursor-pointer": issueCount,
        }
      )}
    >
      {issueCount}
    </div>
  );
});
