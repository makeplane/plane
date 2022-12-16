// react-hook-form
import { Control, Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// types
import { IIssue } from "types";
import { classNames } from "constants/common";
import { CustomMenu, Spinner } from "ui";
import React from "react";
import { ChevronDownIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import CustomSelect from "ui/custom-select";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
};

const SelectState: React.FC<Props> = ({ control, submitChanges }) => {
  const { states } = useUser();

  return (
    <div className="flex items-center py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <Squares2X2Icon className="flex-shrink-0 h-4 w-4" />
        <p>State</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="state"
          render={({ field: { value } }) => (
            <CustomSelect
              label={
                <span
                  className={classNames(
                    value ? "" : "text-gray-900",
                    "flex items-center gap-2 text-left"
                  )}
                >
                  {value ? (
                    <>
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: states?.find((option) => option.id === value)?.color,
                        }}
                      ></span>
                      {states?.find((option) => option.id === value)?.name}
                    </>
                  ) : (
                    "None"
                  )}
                </span>
              }
              value={value}
              onChange={(value: any) => {
                submitChanges({ state: value });
              }}
            >
              {states ? (
                states.length > 0 ? (
                  states.map((option) => (
                    <CustomSelect.Option key={option.id} value={option.id}>
                      <>
                        {option.color && (
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.color }}
                          ></span>
                        )}
                        {option.name}
                      </>
                    </CustomSelect.Option>
                  ))
                ) : (
                  <div className="text-center">No states found</div>
                )
              ) : (
                <Spinner />
              )}
            </CustomSelect>
          )}
        />
      </div>
    </div>
  );
};

export default SelectState;
