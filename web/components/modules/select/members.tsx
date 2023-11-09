import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectService } from "services/project";
// ui
import { Avatar, AvatarGroup, CustomSearchSelect, UserGroupIcon } from "@plane/ui";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[];
  onChange: () => void;
};

const projectService = new ProjectService();

export const ModuleMembersSelect: React.FC<Props> = ({ value, onChange }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.fetchProjectMembers(workspaceSlug as string, projectId as string)
      : null
  );
  const options = members?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar name={member?.member.display_name} src={member?.member.avatar} />
        {member.member.display_name}
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2 text-custom-text-200">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="flex items-center justify-center gap-2">
              <AvatarGroup>
                {value.map((assigneeId) => {
                  const member = members?.find((m) => m.member.id === assigneeId)?.member;

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
};
