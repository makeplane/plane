// react-hook-form
import { Control, Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// types
import { IIssue } from "types";
import { classNames } from "constants/common";
import { Spinner } from "ui";
import React from "react";
import { ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import CustomSelect from "ui/custom-select";

type Props = {
  control: Control<IIssue, any>;
  handleCycleChange: (cycleId: string) => void;
};

const SelectCycle: React.FC<Props> = ({ control, handleCycleChange }) => {
  const { cycles } = useUser();

  return (
    <div className="flex items-center py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <ArrowPathIcon className="flex-shrink-0 h-4 w-4" />
        <p>Cycle</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="cycle"
          render={({ field: { value } }) => (
            <>
              <CustomSelect
                label={
                  <span
                    className={classNames(
                      value ? "" : "text-gray-900",
                      "hidden truncate sm:block text-left"
                    )}
                  >
                    {value ? cycles?.find((c) => c.id === value)?.name : "None"}
                  </span>
                }
                value={value}
                onChange={(value: any) => {
                  handleCycleChange(value);
                }}
              >
                {cycles ? (
                  cycles.length > 0 ? (
                    cycles.map((option) => (
                      <CustomSelect.Option key={option.id} value={option.id}>
                        {option.name}
                      </CustomSelect.Option>
                    ))
                  ) : (
                    <div className="text-center">No cycles found</div>
                  )
                ) : (
                  <Spinner />
                )}
              </CustomSelect>
            </>
          )}
        />
      </div>
    </div>
  );
};

export default SelectCycle;
