import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Check } from "lucide-react";
import { TIssue } from "@plane/types";
// mobx store
import { Avatar } from "@plane/ui";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues, useMember } from "@/hooks/store";
// ui
// types

type Props = {
  closePalette: () => void;
  issue: TIssue;
};

export const ChangeIssueAssignee: React.FC<Props> = observer((props) => {
  const { closePalette, issue } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const {
    issues: { updateIssue },
  } = useIssues(EIssuesStoreType.PROJECT);
  const {
    project: { projectMemberIds, getProjectMemberDetails },
  } = useMember();

  const options =
    projectMemberIds?.map((userId) => {
      const memberDetails = getProjectMemberDetails(userId);

      return {
        value: `${memberDetails?.member?.id}`,
        query: `${memberDetails?.member?.display_name}`,
        content: (
          <>
            <div className="flex items-center gap-2">
              <Avatar
                name={memberDetails?.member?.display_name}
                src={memberDetails?.member?.avatar}
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
    }) ?? [];

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
});
