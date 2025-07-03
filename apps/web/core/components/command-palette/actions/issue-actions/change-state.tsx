"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueServiceType, TIssue } from "@plane/types";
// store hooks
import { useIssueDetail } from "@/hooks/store";
// plane web imports
import { ChangeWorkItemStateList } from "@/plane-web/components/command-palette/actions/work-item-actions";

type Props = { closePalette: () => void; issue: TIssue };

export const ChangeIssueState: React.FC<Props> = observer((props) => {
  const { closePalette, issue } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { updateIssue } = useIssueDetail(issue?.is_epic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  // derived values
  const projectId = issue?.project_id;
  const currentStateId = issue?.state_id;

  const submitChanges = async (formData: Partial<TIssue>) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const payload = { ...formData };
    await updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, payload).catch((e) => {
      console.error(e);
    });
  };

  const handleIssueState = (stateId: string) => {
    submitChanges({ state_id: stateId });
    closePalette();
  };

  return (
    <ChangeWorkItemStateList
      projectId={projectId}
      currentStateId={currentStateId}
      handleStateChange={handleIssueState}
    />
  );
});
