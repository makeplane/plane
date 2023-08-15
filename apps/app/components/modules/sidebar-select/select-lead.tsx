import React from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// ui
import { Avatar, CustomSearchSelect } from "components/ui";
// icons
import { UserCircleIcon } from "@heroicons/react/24/outline";
import User from "public/user.png";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string | null | undefined;
  onChange: (val: string) => void;
};

export const SidebarLeadSelect: React.FC<Props> = ({ value, onChange }) => {
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

  const selectedOption = members?.find((m) => m.member.id === value)?.member;

  return (
    <div className="flex items-center justify-start gap-1">
      <div className="flex w-40 items-center justify-start gap-2 text-custom-text-200">
        <UserCircleIcon className="h-5 w-5" />
        <span>Lead</span>
      </div>
      <div className="sm:basis-1/2">
        <CustomSearchSelect
          value={value}
          label={
            <div className="flex items-center gap-2">
              {selectedOption && <Avatar user={selectedOption} />}
              {selectedOption ? (
                selectedOption?.display_name
              ) : (
                <span className="text-custom-text-200">No lead</span>
              )}
            </div>
          }
          options={options}
          maxHeight="md"
          position="right"
          onChange={onChange}
        />
      </div>
    </div>
  );
};
