import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// ui
import { CustomSearchSelect } from "components/ui";
import { AssigneesList, Avatar } from "components/ui/avatar";
// icons
import { UserGroupIcon } from "@heroicons/react/24/outline";
// types
import { UserAuth } from "types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[];
  onChange: (val: string[]) => void;
  userAuth: UserAuth;
  disabled?: boolean;
};

export const SidebarAssigneeSelect: React.FC<Props> = ({
  value,
  onChange,
  userAuth,
  disabled = false,
}) => {
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
    query:
      (member.member.first_name && member.member.first_name !== ""
        ? member.member.first_name
        : member.member.email) +
        " " +
        member.member.last_name ?? "",
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {`${
          member.member.first_name && member.member.first_name !== ""
            ? member.member.first_name
            : member.member.email
        } ${member.member.last_name ?? ""}`}
      </div>
    ),
  }));

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disabled;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
        <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
        <p>Assignees</p>
      </div>
      <div className="sm:basis-1/2">
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
          disabled={isNotAllowed}
        />
      </div>
    </div>
  );
};
