import React from "react";
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

type Props = {
  value: string[];
  onChange: () => void;
};

const projectMemberService = new ProjectMemberService();

export const ModuleMembersSelect: React.FC<Props> = observer(({ value, onChange }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

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
          <Avatar name={member.display_name} src={member.avatar} />
          {member.display_name}
        </div>
      ),
    };
  });

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2 text-custom-text-200">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="flex items-center justify-center gap-2">
              <AvatarGroup>
                {value.map((assigneeId) => {
                  const memberId = members?.find((m) => m.member === assigneeId)?.id;

                  const member = memberMap[memberId || ""];

                  if (!member) return null;

                  return <Avatar key={member.id} name={member.display_name} src={member.avatar} />;
                })}
              </AvatarGroup>
              <span className="text-custom-text-200">{value.length} Assignees</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-custom-text-300">
              <UserGroupIcon className="h-3 w-3" />
              <span>Assignee</span>
            </div>
          )}
        </div>
      }
      options={options}
      onChange={onChange}
      maxHeight="md"
      multiple
      noChevron
    />
  );
});
