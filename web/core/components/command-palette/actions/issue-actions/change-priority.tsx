"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
// plane constants
import { ISSUE_PRIORITIES } from "@plane/constants";
// plane types
import { EIssueServiceType, TIssue, TIssuePriorities } from "@plane/types";
// mobx store
import { PriorityIcon } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// ui
// types
// constants

type Props = { closePalette: () => void; issue: TIssue };

export const ChangeIssuePriority: React.FC<Props> = observer((props) => {
  const { closePalette, issue } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { updateIssue } = useIssueDetail(issue?.is_epic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  // derived values
  const projectId = issue?.project_id;

  const submitChanges = async (formData: Partial<TIssue>) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const payload = { ...formData };
    await updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, payload).catch((e) => {
      console.error(e);
    });
  };

  const handleIssueState = (priority: TIssuePriorities) => {
    submitChanges({ priority });
    closePalette();
  };

  return (
    <>
      {ISSUE_PRIORITIES.map((priority) => (
        <Command.Item key={priority.key} onSelect={() => handleIssueState(priority.key)} className="focus:outline-none">
          <div className="flex items-center space-x-3">
            <PriorityIcon priority={priority.key} />
            <span className="capitalize">{priority.title ?? "None"}</span>
          </div>
          <div>{priority.key === issue.priority && <Check className="h-3 w-3" />}</div>
        </Command.Item>
      ))}
    </>
  );
});
