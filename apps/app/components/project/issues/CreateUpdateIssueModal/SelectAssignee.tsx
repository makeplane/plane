import React from "react";
// swr
import useSWR from "swr";
// react hook form
import { Controller } from "react-hook-form";
// service
import projectServices from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// types
import type { Control } from "react-hook-form";
import type { IIssue, WorkspaceMember } from "types";
import { UserIcon } from "@heroicons/react/24/outline";

import { SearchListbox } from "ui";

type Props = {
  control: Control<IIssue, any>;
};

const SelectAssignee: React.FC<Props> = ({ control }) => {
  const { activeWorkspace, activeProject } = useUser();

  const { data: people } = useSWR<WorkspaceMember[]>(
    activeWorkspace && activeProject ? PROJECT_MEMBERS(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => projectServices.projectMembers(activeWorkspace.slug, activeProject.id)
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
            return { value: person.member.id, display: person.member.first_name };
          })}
          multiple={true}
          value={value}
          onChange={onChange}
          icon={<UserIcon className="h-4 w-4 text-gray-400" />}
        />
      )}
    />
  );
};

export default SelectAssignee;
