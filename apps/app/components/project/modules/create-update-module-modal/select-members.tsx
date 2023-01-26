import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { Controller, Control } from "react-hook-form";
import { UserIcon } from "@heroicons/react/24/outline";
// import type { Control } from "react-hook-form";
// service
import type { IModule } from "types";
import projectServices from "services/project.service";
// ui
import SearchListbox from "components/search-listbox";
// icons
// types
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  control: Control<IModule, any>;
};

const SelectMembers: React.FC<Props> = ({ control }) => {
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
      name="members_list"
      render={({ field: { value, onChange } }) => (
        <SearchListbox
          title="Members"
          optionsFontsize="sm"
          options={people?.map((person) => ({
            value: person.member.id,
            display:
              person.member.first_name && person.member.first_name !== ""
                ? person.member.first_name
                : person.member.email,
          }))}
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
