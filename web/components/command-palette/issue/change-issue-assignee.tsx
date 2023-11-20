import { Dispatch, SetStateAction, useCallback, FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { Command } from "cmdk";
import { Check } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { IssueService } from "services/issue";
// ui
import { Avatar } from "@plane/ui";
// types
import { IUser, IIssue } from "types";
// constants
import { ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = {
  setIsPaletteOpen: Dispatch<SetStateAction<boolean>>;
  issue: IIssue;
  user: IUser | undefined;
};

// services
const issueService = new IssueService();

export const ChangeIssueAssignee: FC<Props> = observer((props) => {
  const { setIsPaletteOpen, issue } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;
  // store
  const {
    projectMember: { projectMembers },
  } = useMobxStore();

  const options =
    projectMembers?.map(({ member }) => ({
      value: member.id,
      query: member.display_name,
      content: (
        <>
          <div className="flex items-center gap-2">
            <Avatar name={member.display_name} src={member.avatar} showTooltip={false} />
            {member.display_name}
          </div>
          {issue.assignees.includes(member.id) && (
            <div>
              <Check className="h-3 w-3" />
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

    updateIssue({ assignees: updatedAssignees });
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
});
