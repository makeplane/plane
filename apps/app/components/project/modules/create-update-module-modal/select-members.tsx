// react
import React from "react";
// swr
import useSWR from "swr";
// react hook form
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
// service
import projectServices from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { SearchListbox } from "ui";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
// types
import type { IModule } from "types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  control: Control<IModule, any>;
};

const SelectMembers: React.FC<Props> = ({ control }) => {
  const { activeWorkspace, activeProject } = useUser();

  const { data: people } = useSWR(
    activeWorkspace && activeProject ? PROJECT_MEMBERS(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => projectServices.projectMembers(activeWorkspace.slug, activeProject.id)
      : null
  );

  return (
    <Controller
      control={control}
      name="members_list"
      render={({ field: { value, onChange } }) => (
        <SearchListbox
          title="Members"
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
        />
      )}
    />
  );
};

export default SelectMembers;
