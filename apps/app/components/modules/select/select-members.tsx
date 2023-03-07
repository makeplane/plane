import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectServices from "services/project.service";
// ui
import { AssigneesList, Avatar, CustomSearchSelect } from "components/ui";
// icons
import { UserGroupIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[];
  onChange: () => void;
};

export const ModuleMembersSelect: React.FC<Props> = ({ value, onChange }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectServices.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );
  const options =
    members?.map((member) => ({
      value: member.member.id,
      query:
        (member.member.first_name && member.member.first_name !== ""
          ? member.member.first_name
          : member.member.email) +
          " " +
          member.member.last_name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <Avatar user={member.member} />
          {member.member.first_name && member.member.first_name !== ""
            ? member.member.first_name
            : member.member.email}
        </div>
      ),
    })) ?? [];

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2 text-gray-500">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="flex items-center justify-center gap-2">
              <AssigneesList userIds={value} length={3} showLength={false} />
              <span className="text-gray-500">{value.length} Assignees</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">Assignee</span>
            </div>
          )}
        </div>
      }
      options={options}
      onChange={onChange}
      height="md"
      multiple
      noChevron
    />
  );
};
