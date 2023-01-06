import React from "react";
// swr
import useSWR from "swr";
// react hook form
import { Controller } from "react-hook-form";
// services
import cycleServices from "lib/services/cycles.service";
// constants
import { CYCLE_LIST } from "constants/fetch-keys";
// ui
import { CustomListbox } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/20/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// types
import type { IIssue } from "types";
import type { Control } from "react-hook-form";
import { useRouter } from "next/router";

type Props = {
  control: Control<IIssue, any>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeProject: string;
};

const SelectCycle: React.FC<Props> = ({ control, setIsOpen, activeProject }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: cycles } = useSWR(
    workspaceSlug && activeProject ? CYCLE_LIST(activeProject) : null,
    workspaceSlug && activeProject
      ? () => cycleServices.getCycles(workspaceSlug as string, activeProject)
      : null
  );

  return (
    <Controller
      control={control}
      name="cycle"
      render={({ field: { value, onChange } }) => (
        <CustomListbox
          title={cycles?.find((i) => i.id.toString() === value?.toString())?.name ?? "Cycle"}
          options={cycles?.map((cycle) => {
            return { value: cycle.id, display: cycle.name };
          })}
          value={value}
          optionsFontsize="sm"
          onChange={onChange}
          icon={<ArrowPathIcon className="h-3 w-3 text-gray-500" />}
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
                <span className="block truncate">Create cycle</span>
              </span>
            </button>
          }
        />
      )}
    />
  );
};

export default SelectCycle;
