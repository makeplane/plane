// react
import React from "react";
// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// ui
import { CustomSelect } from "ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
// types
import { IModule } from "types";
// common
import { classNames } from "constants/common";
// constants
import { MODULE_STATUS } from "constants/";

type Props = {
  control: Control<Partial<IModule>, any>;
  submitChanges: (formData: Partial<IModule>) => void;
  watch: UseFormWatch<Partial<IModule>>;
};

const SelectStatus: React.FC<Props> = ({ control, submitChanges, watch }) => {
  return (
    <div className="flex items-center py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <Squares2X2Icon className="flex-shrink-0 h-4 w-4" />
        <p>Status</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="status"
          render={({ field: { value } }) => (
            <CustomSelect
              label={
                <span
                  className={classNames(
                    value ? "" : "text-gray-900",
                    "text-left capitalize flex items-center gap-2"
                  )}
                >
                  {watch("status")}
                </span>
              }
              value={value}
              onChange={(value: any) => {
                submitChanges({ status: value });
              }}
            >
              {MODULE_STATUS.map((option) => (
                <CustomSelect.Option key={option.value} value={option.value}>
                  {option.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      </div>
    </div>
  );
};

export default SelectStatus;
