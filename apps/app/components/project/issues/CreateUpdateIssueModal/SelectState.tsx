import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// icons
import { PlusIcon } from "@heroicons/react/20/solid";
// ui
import { CustomListbox } from "ui";
// types
import type { Control } from "react-hook-form";
import type { IIssue } from "types";
import { Squares2X2Icon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SelectState: React.FC<Props> = ({ control, setIsOpen }) => {
  const { states } = useUser();

  return (
    <>
      <Controller
        control={control}
        name="state"
        render={({ field: { value, onChange } }) => (
          <CustomListbox
            title="State"
            options={states?.map((state) => {
              return { value: state.id, display: state.name };
            })}
            value={value}
            optionsFontsize="sm"
            onChange={onChange}
            icon={<Squares2X2Icon className="h-4 w-4 text-gray-400" />}
            footerOption={
              <button
                type="button"
                className="select-none relative py-2 pl-3 pr-9 flex items-center gap-x-2 text-gray-400 hover:text-gray-500"
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
      ></Controller>
    </>
  );
};

export default SelectState;
