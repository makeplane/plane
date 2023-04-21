import { useRouter } from "next/router";
import React, { Dispatch, SetStateAction, useCallback } from "react";
import useSWR, { mutate } from "swr";

// cmdk
import { Command } from "cmdk";
// services
import issuesService from "services/issues.service";
// types
import { IIssue } from "types";
// constants
import { ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY, PROJECT_MEMBERS } from "constants/fetch-keys";
// icons
import { CheckIcon } from "components/icons";
import projectService from "services/project.service";
import { Avatar } from "components/ui";

type Props = {
  setIsPaletteOpen: Dispatch<SetStateAction<boolean>>;
  issue: IIssue;
};

export const ChangeIssueAssignee: React.FC<Props> = ({ setIsPaletteOpen, issue }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: members } = useSWR(
    projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options =
    members?.map(({ member }) => ({
      value: member.id,
      query:
        (member.first_name && member.first_name !== "" ? member.first_name : member.email) +
          " " +
          member.last_name ?? "",
      content: (
        <>
          <div className="flex items-center gap-2">
            <Avatar user={member} />
            {member.first_name && member.first_name !== "" ? member.first_name : member.email}
          </div>
          {issue.assignees.includes(member.id) && (
            <div>
              <CheckIcon className="h-3 w-3" />
            </div>
          )}
        </>
      ),
    })) ?? [];

  const updateIssue = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      mutate(
        ISSUE_DETAILS(issueId as string),
        (prevData: IIssue) => ({
          ...prevData,
          ...formData,
        }),
        false
      );

      const payload = { ...formData };
      await issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload)
        .then(() => {
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId]
  );

  const handleIssueAssignees = (assignee: string) => {
    const updatedAssignees = issue.assignees ?? [];

    if (updatedAssignees.includes(assignee)) {
      updatedAssignees.splice(updatedAssignees.indexOf(assignee), 1);
    } else {
      updatedAssignees.push(assignee);
    }

    updateIssue({ assignees_list: updatedAssignees });
    setIsPaletteOpen(false);
  };

  return (
    <>
      {options.map((option) => (
        <Command.Item
          key={option.value}
          onSelect={() => handleIssueAssignees(option.value)}
          className="focus:outline-none"
        >
          {option.content}
        </Command.Item>
      ))}
    </>
  );
};
