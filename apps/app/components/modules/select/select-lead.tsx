import React from "react";

import { useRouter } from "next/router";
import Image from "next/image";

import useSWR from "swr";

// services
import projectServices from "services/project.service";
// ui
import { Avatar, CustomSearchSelect } from "components/ui";
// icons
import User from "public/user.png";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string | null;
  onChange: () => void;
};

export const ModuleLeadSelect: React.FC<Props> = ({ value, onChange }) => {
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

  const selectedOption = members?.find((m) => m.member.id === value)?.member;

  return (
    <CustomSearchSelect
      options={options}
      value={value}
      label={
        <div className="flex items-center gap-2 text-brand-secondary">
          {selectedOption ? (
            <Avatar user={selectedOption} />
          ) : (
            <div className="h-4 w-4 rounded-full bg-brand-surface-2">
              <Image src={User} height="100%" width="100%" className="rounded-full" alt="No user" />
            </div>
          )}
          {selectedOption
            ? selectedOption?.first_name && selectedOption.first_name !== ""
              ? selectedOption?.first_name
              : selectedOption?.email
            : "N/A"}
        </div>
      }
      onChange={onChange}
      noChevron
    />
  );
};
