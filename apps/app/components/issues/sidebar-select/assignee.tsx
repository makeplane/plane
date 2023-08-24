import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// ui
import { CustomSearchSelect } from "components/ui";
import { AssigneesList, Avatar } from "components/ui/avatar";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
};

export const SidebarAssigneeSelect: React.FC<Props> = ({ value, onChange, disabled = false }) => {
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
        <Avatar user={member.member} />
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
            <div className="-my-0.5 flex items-center justify-center gap-2">
              <AssigneesList userIds={value} length={3} showLength={false} />
              <span className="text-custom-text-100">{value.length} Assignees</span>
            </div>
          ) : (
            "No assignees"
          )}
        </div>
      }
      options={options}
      onChange={onChange}
      position="right"
      multiple
      disabled={disabled}
    />
  );
};
