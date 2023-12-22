import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectMemberService } from "services/project";
// ui
import { Avatar, AvatarGroup, CustomSearchSelect, UserGroupIcon } from "@plane/ui";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
import { useMember } from "hooks/store";
import { observer } from "mobx-react-lite";

export type Props = {
  projectId: string;
  value: string[];
  onChange: (value: string[]) => void;
};

const projectMemberService = new ProjectMemberService();

export const IssueAssigneeSelect: React.FC<Props> = observer(({ projectId, value = [], onChange }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { memberMap } = useMember();

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectMemberService.fetchProjectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = members?.map((membership) => {
    const member = memberMap[membership.id];
    return {
      value: member.id,
      query: member.display_name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={member.display_name} src={member.avatar} showTooltip={false} />
          {member.is_bot ? member.first_name : member.display_name}
        </div>
      ),
    };
  });

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      customButton={
        <div className="flex cursor-pointer items-center gap-2 text-xs text-custom-text-200">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="-my-0.5 flex items-center justify-center gap-2">
              <AvatarGroup showTooltip={false}>
                {value.map((assigneeId) => {
                  const membership = members?.find((m) => m.member === assigneeId)?.id;

                  const member = memberMap[membership || ""];

                  if (!member) return null;

                  return <Avatar key={member.id} name={member.display_name} src={member.avatar} />;
                })}
              </AvatarGroup>
            </div>
          ) : (
            <div className="flex w-full items-center justify-center gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1 text-xs text-custom-text-300">
              <UserGroupIcon className="h-3 w-3" />
              <span>Assignee</span>
            </div>
          )}
        </div>
      }
      multiple
      noChevron
    />
  );
});
