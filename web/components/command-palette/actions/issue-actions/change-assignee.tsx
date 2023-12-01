import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Command } from "cmdk";
import { Check } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Avatar } from "@plane/ui";
// types
import { IIssue } from "types";

type Props = {
  closePalette: () => void;
  issue: IIssue;
};

export const ChangeIssueAssignee: React.FC<Props> = observer((props) => {
  const { closePalette, issue } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const {
    projectIssues: { updateIssue },
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

  const handleUpdateIssue = async (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const payload = { ...formData };
    await updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, payload).catch((e) => {
      console.error(e);
    });
  };

  const handleIssueAssignees = (assignee: string) => {
    const updatedAssignees = issue.assignees ?? [];

    if (updatedAssignees.includes(assignee)) updatedAssignees.splice(updatedAssignees.indexOf(assignee), 1);
    else updatedAssignees.push(assignee);

    handleUpdateIssue({ assignees: updatedAssignees });
    closePalette();
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
