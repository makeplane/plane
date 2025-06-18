"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
// plane types
import { EIssueServiceType, TIssue } from "@plane/types";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useIssueDetail, useMember } from "@/hooks/store";

type Props = { closePalette: () => void; issue: TIssue };

export const ChangeIssueAssignee: React.FC<Props> = observer((props) => {
  const { closePalette, issue } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store
  const { updateIssue } = useIssueDetail(issue?.is_epic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  const {
    project: { getProjectMemberIds, getProjectMemberDetails },
  } = useMember();
  // derived values
  const projectId = issue?.project_id ?? "";
  const projectMemberIds = getProjectMemberIds(projectId, false);

  const options =
    projectMemberIds
      ?.map((userId) => {
        if (!projectId) return;
        const memberDetails = getProjectMemberDetails(userId, projectId.toString());

        return {
          value: `${memberDetails?.member?.id}`,
          query: `${memberDetails?.member?.display_name}`,
          content: (
            <>
              <div className="flex items-center gap-2">
                <Avatar
                  name={memberDetails?.member?.display_name}
                  src={getFileURL(memberDetails?.member?.avatar_url ?? "")}
                  showTooltip={false}
                />
                {memberDetails?.member?.display_name}
              </div>
              {issue.assignee_ids.includes(memberDetails?.member?.id ?? "") && (
                <div>
                  <Check className="h-3 w-3" />
                </div>
              )}
            </>
          ),
        };
      })
      .filter((o) => o !== undefined) ?? [];

  const handleUpdateIssue = async (formData: Partial<TIssue>) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const payload = { ...formData };
    await updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, payload).catch((e) => {
      console.error(e);
    });
  };

  const handleIssueAssignees = (assignee: string) => {
    const updatedAssignees = issue.assignee_ids ?? [];

    if (updatedAssignees.includes(assignee)) updatedAssignees.splice(updatedAssignees.indexOf(assignee), 1);
    else updatedAssignees.push(assignee);

    handleUpdateIssue({ assignee_ids: updatedAssignees });
    closePalette();
  };

  return (
    <>
      {options.map(
        (option) =>
          option && (
            <Command.Item
              key={option.value}
              onSelect={() => handleIssueAssignees(option.value)}
              className="focus:outline-none"
            >
              {option.content}
            </Command.Item>
          )
      )}
    </>
  );
});
