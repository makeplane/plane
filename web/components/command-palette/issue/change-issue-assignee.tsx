import { Dispatch, SetStateAction, useCallback, FC } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { Command } from "cmdk";
// services
import { IssueService } from "services/issue";
// hooks
import useProjectMembers from "hooks/use-project-members";
// constants
import { ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
// ui
import { Avatar } from "components/ui";
// icons
import { CheckIcon } from "components/icons";
// types
import { IUser, IIssue } from "types";

type Props = {
  setIsPaletteOpen: Dispatch<SetStateAction<boolean>>;
  issue: IIssue;
  user: IUser | undefined;
};

// services
const issueService = new IssueService();

export const ChangeIssueAssignee: FC<Props> = ({ setIsPaletteOpen, issue, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { members } = useProjectMembers(workspaceSlug as string, projectId as string);

  const options =
    members?.map(({ member }: any) => ({
      value: member.id,
      query: member.display_name,
      content: (
        <>
          <div className="flex items-center gap-2">
            <Avatar user={member} />
            {member.display_name}
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

      mutate<IIssue>(
        ISSUE_DETAILS(issueId as string),
        async (prevData) => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            ...formData,
          };
        },
        false
      );

      const payload = { ...formData };
      await issueService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload, user)
        .then(() => {
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId, user]
  );

  const handleIssueAssignees = (assignee: string) => {
    const updatedAssignees = issue.assignees_list ?? [];

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
      {options.map((option: any) => (
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
