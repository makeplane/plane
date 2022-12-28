import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { CustomListbox } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/20/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// types
import type { IIssue } from "types";
import type { Control } from "react-hook-form";

type Props = {
  control: Control<IIssue, any>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SelectSprint: React.FC<Props> = ({ control, setIsOpen }) => {
  const { cycles } = useUser();

  return (
    <Controller
      control={control}
      name="sprints"
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

export default SelectSprint;
