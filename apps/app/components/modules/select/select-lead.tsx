import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { Controller, Control } from "react-hook-form";
// services
import projectServices from "services/project.service";
// ui
import SearchListbox from "components/search-listbox";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
// types
import type { IModule } from "types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  control: Control<IModule, any>;
};

export const ModuleLeadSelect: React.FC<Props> = ({ control }) => {
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
      name="lead"
      render={({ field: { value, onChange } }) => (
        <SearchListbox
          title="Lead"
          optionsFontsize="sm"
          options={people?.map((person) => ({
            value: person.member.id,
            display:
              person.member.first_name && person.member.first_name !== ""
                ? person.member.first_name
                : person.member.email,
          }))}
          value={value}
          onChange={onChange}
          icon={<UserIcon className="h-3 w-3 text-gray-500" />}
        />
      )}
    />
  );
};
