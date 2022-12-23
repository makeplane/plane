// react
import React from "react";
// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon, ChartBarIcon } from "@heroicons/react/24/outline";
// types
import { IIssue } from "types";
// constants
import { classNames } from "constants/common";
import { PRIORITIES } from "constants/";
import CustomSelect from "ui/custom-select";
import { getPriorityIcon } from "constants/global";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
  watch: UseFormWatch<IIssue>;
};

const SelectPriority: React.FC<Props> = ({ control, submitChanges, watch }) => {
  return (
    <div className="flex items-center py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <ChartBarIcon className="flex-shrink-0 h-4 w-4" />
        <p>Priority</p>
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
                    "text-left capitalize flex items-center gap-2"
                  )}
                >
                  {getPriorityIcon(
                    watch("priority") && watch("priority") !== ""
                      ? watch("priority") ?? ""
                      : "None",
                    "text-sm"
                  )}
                  {watch("priority") && watch("priority") !== "" ? watch("priority") : "None"}
                </span>
              }
              value={value}
              onChange={(value: any) => {
                submitChanges({ priority: value });
              }}
            >
              {PRIORITIES.map((option) => (
                <CustomSelect.Option key={option} value={option} className="capitalize">
                  <>
                    {getPriorityIcon(option, "text-sm")}
                    {option}
                  </>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      </div>
    </div>
  );
};

export default SelectPriority;
