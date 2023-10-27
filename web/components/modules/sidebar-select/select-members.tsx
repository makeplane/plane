import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { ProjectService } from "services/project";
// ui
import { AssigneesList, Avatar } from "components/ui";
import { CustomSearchSelect, UserGroupIcon } from "@plane/ui";
// icons
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[] | undefined;
  onChange: (val: string[]) => void;
};

// services
const projectService = new ProjectService();

export const SidebarMembersSelect: React.FC<Props> = ({ value, onChange }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = members?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} height="18px" width="18px" />
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
      <div className="flex items-center w-1/2">
        <CustomSearchSelect
          className="w-full"
          value={value ?? []}
          label={
            <div className="flex items-center gap-2 text-xs text-custom-text-200">
              {value && value.length > 0 && Array.isArray(value) ? (
                <div className="flex items-center justify-center gap-2">
                  <AssigneesList userIds={value} height="18px" width="18px" length={3} showLength={false} />
                  <span className="text-custom-text-200">{value.length} Assignees</span>
                </div>
              ) : (
                "No members"
              )}
            </div>
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
