"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local components
import { EpicItemDetailsHeader } from "./epic-header";
import { WorkItemDetailsHeader } from "./work-item-header";

export const ProjectWorkItemDetailsHeader = observer(() => {
  // router
  const { workItem } = useParams();
  // store hooks
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  // derived values
  const issueId = getIssueIdByIdentifier(workItem?.toString());
  const issueDetails = issueId ? getIssueById(issueId?.toString()) : undefined;

  return <>{issueDetails?.is_epic ? <EpicItemDetailsHeader /> : <WorkItemDetailsHeader />}</>;
});
