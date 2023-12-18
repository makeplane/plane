import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectMemberService } from "services/project";
// ui
import { Avatar, AvatarGroup, CustomSearchSelect, UserGroupIcon } from "@plane/ui";
// icons
import { ChevronDown } from "lucide-react";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[] | undefined;
  onChange: (val: string[]) => void;
  disabled?: boolean;
};

// services
const projectMemberService = new ProjectMemberService();

export const SidebarMembersSelect: React.FC<Props> = ({ value, onChange, disabled = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectMemberService.fetchProjectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = members?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar name={member?.member.display_name} src={member?.member.avatar} showTooltip={false} />
        {member.member.display_name}
      </div>
    ),
  }));

  return (
    <div className="flex items-center justify-start gap-1">
      <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
        <UserGroupIcon className="h-4 w-4" />
        <span className="text-base">Members</span>
      </div>
      <div className="flex w-1/2 items-center rounded-sm ">
        <CustomSearchSelect
          disabled={disabled}
          className="w-full rounded-sm"
          value={value ?? []}
          customButtonClassName="rounded-sm"
          customButton={
            value && value.length > 0 && Array.isArray(value) ? (
              <div className="px-1">
                <AvatarGroup showTooltip={false}>
                  {value.map((assigneeId) => {
                    const member = members?.find((m) => m.member.id === assigneeId)?.member;

                    if (!member) return null;

                    return <Avatar key={member.id} name={member.display_name} src={member.avatar} />;
                  })}
                </AvatarGroup>
              </div>
            ) : (
              <div className="group flex w-full items-center justify-between gap-2 p-1 text-sm text-custom-text-400">
                <span>No members</span>
                {!disabled && <ChevronDown className="hidden h-3.5 w-3.5 group-hover:flex" />}
              </div>
            )
          }
          options={options}
          onChange={onChange}
          maxHeight="md"
          multiple
        />
      </div>
    </div>
  );
};
