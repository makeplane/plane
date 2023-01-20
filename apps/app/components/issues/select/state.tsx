import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Controller, Control } from "react-hook-form";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
// services
import stateService from "services/state.service";
// icons
import { PlusIcon } from "@heroicons/react/20/solid";
// ui
import { CustomListbox } from "components/ui";
// types
import type { IIssue } from "types";
// fetch keys
import { STATE_LIST } from "constants/fetch-keys";

type Props = {
  control: Control<IIssue, any>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const IssueStateSelect: React.FC<Props> = ({ control, setIsOpen }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <Controller
      control={control}
      name="state"
      render={({ field: { value, onChange } }) => (
        <CustomListbox
          title="State"
          options={states?.map((state) => ({
            value: state.id,
            display: state.name,
            color: state.color,
          }))}
          value={value}
          optionsFontsize="sm"
          onChange={onChange}
          icon={<Squares2X2Icon className="h-4 w-4 text-gray-400" />}
          footerOption={
            <button
              type="button"
              className="relative flex select-none items-center gap-x-2 py-2 pl-3 pr-9 text-gray-400 hover:text-gray-500"
              onClick={() => setIsOpen(true)}
            >
              <span>
                <PlusIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
              <span>
                <span className="block truncate">Create state</span>
              </span>
            </button>
          }
        />
      )}
    />
  );
};
