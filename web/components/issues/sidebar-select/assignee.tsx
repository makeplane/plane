import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectMemberService } from "services/project";
// ui
import { Avatar, AvatarGroup, CustomSearchSelect } from "@plane/ui";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[];
  projectId: string;
  onChange: (val: string[]) => void;
  disabled?: boolean;
};

// services
const projectMemberService = new ProjectMemberService();

export const SidebarAssigneeSelect: React.FC<Props> = ({ value, projectId, onChange, disabled = false }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

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
        <Avatar name={member?.member.display_name} src={member?.member.avatar} />
        {member.member.display_name}
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      value={value}
      customButton={
        <>
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="-my-0.5 flex items-center gap-2">
              <AvatarGroup>
                {value.map((assigneeId) => {
                  const member = members?.find((m) => m.member.id === assigneeId)?.member;

                  if (!member) return null;

                  return <Avatar key={member.id} name={member.display_name} src={member.avatar} />;
                })}
              </AvatarGroup>
              <span className="text-xs text-custom-text-100">{value.length} Assignees</span>
            </div>
          ) : (
            <button
              type="button"
              className={`rounded bg-custom-background-80 px-2.5 py-0.5 text-xs text-custom-text-200 ${
                disabled ? "cursor-not-allowed" : ""
              }`}
            >
              No assignees
            </button>
          )}
        </>
      }
      options={options}
      onChange={onChange}
      multiple
      disabled={disabled}
    />
  );
};
