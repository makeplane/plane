"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// ui
import { CustomMenu } from "@plane/ui";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

type TIssueParentSiblingItem = {
  workspaceSlug: string;
  issueId: string;
};

export const IssueParentSiblingItem: FC<TIssueParentSiblingItem> = observer((props) => {
  const { workspaceSlug, issueId } = props;
  // hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issueDetail = (issueId && getIssueById(issueId)) || undefined;
  if (!issueDetail) return <></>;

  const projectDetails = (issueDetail.project_id && getProjectById(issueDetail.project_id)) || undefined;

  return (
    <>
      <CustomMenu.MenuItem key={issueDetail.id}>
        <Link
          href={`/${workspaceSlug}/projects/${issueDetail?.project_id as string}/issues/${issueDetail.id}`}
          target="_blank"
          className="flex items-center gap-2 py-0.5"
        >
          {issueDetail.project_id && projectDetails?.identifier && (
            <IssueIdentifier
              projectId={issueDetail.project_id}
              issueTypeId={issueDetail.type_id}
              projectIdentifier={projectDetails?.identifier}
              issueSequenceId={issueDetail.sequence_id}
              textContainerClassName="text-xs"
            />
          )}
        </Link>
      </CustomMenu.MenuItem>
    </>
  );
});
