import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// ui
import { AssigneesList, Avatar, CustomSearchSelect } from "components/ui";
// icons
import { UserGroupIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[] | undefined;
  onChange: (val: string[]) => void;
};

export const SidebarMembersSelect: React.FC<Props> = ({ value, onChange }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
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
    <div className="flex items-center justify-start gap-1">
      <div className="flex w-40 items-center justify-start gap-2 text-brand-secondary">
        <UserGroupIcon className="h-5 w-5" />
        <span>Members</span>
      </div>
      <div className="sm:basis-1/2">
        <CustomSearchSelect
          value={value}
          label={
            <div className="flex items-center gap-2 text-brand-secondary">
              {value && value.length > 0 && Array.isArray(value) ? (
                <div className="flex items-center justify-center gap-2">
                  <AssigneesList userIds={value} length={3} showLength={false} />
                  <span className="text-brand-secondary">{value.length} Assignees</span>
                </div>
              ) : (
                "No members"
              )}
            </div>
          }
          options={options}
          onChange={onChange}
          height="md"
          position="right"
          multiple
        />
      </div>
    </div>
  );
};
