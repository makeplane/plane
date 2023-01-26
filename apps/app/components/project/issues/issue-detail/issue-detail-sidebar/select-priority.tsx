// react
import React from "react";
// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// ui
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { CustomSelect } from "components/ui";
// icons
// types
import { IIssue } from "types";
// common
// constants
import { getPriorityIcon } from "constants/global";
import { PRIORITIES } from "constants/";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
  watch: UseFormWatch<IIssue>;
};

const SelectPriority: React.FC<Props> = ({ control, submitChanges, watch }) => (
  <div className="flex flex-wrap items-center py-2">
    <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
      <ChartBarIcon className="h-4 w-4 flex-shrink-0" />
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
                className={`flex items-center gap-2 text-left capitalize ${
                  value ? "" : "text-gray-900"
                }`}
              >
                {getPriorityIcon(
                  watch("priority") && watch("priority") !== "" ? watch("priority") ?? "" : "None",
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
                  {option ?? "None"}
                </>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        )}
      />
    </div>
  </div>
);

export default SelectPriority;
