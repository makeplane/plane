import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { Controller } from "react-hook-form";
// service
import projectServices from "lib/services/project.service";
// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// types
import type { Control } from "react-hook-form";
import type { IIssue } from "types";
import { UserIcon } from "@heroicons/react/24/outline";

import { SearchListbox } from "ui";

type Props = {
  control: Control<IIssue, any>;
};

const SelectAssignee: React.FC<Props> = ({ control }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectServices.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <Controller
      control={control}
      name="assignees_list"
      render={({ field: { value, onChange } }) => (
        <SearchListbox
          title="Assignees"
          optionsFontsize="sm"
          options={people?.map((person) => {
            return {
              value: person.member.id,
              display:
                person.member.first_name && person.member.first_name !== ""
                  ? person.member.first_name
                  : person.member.email,
            };
          })}
          multiple={true}
          value={value}
          onChange={onChange}
          icon={<UserIcon className="h-3 w-3 text-gray-500" />}
          assignee
        />
      )}
    />
  );
};

export default SelectAssignee;
