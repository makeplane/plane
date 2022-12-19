// react
import React from "react";
// react-hook-form
import { Control, Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Spinner, CustomSelect } from "ui";
// icons
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// types
import { IIssue } from "types";
// common
import { classNames } from "constants/common";

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
          name="issue_cycle"
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
                    {value ? cycles?.find((c) => c.id === value.cycle_detail.id)?.name : "None"}
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
