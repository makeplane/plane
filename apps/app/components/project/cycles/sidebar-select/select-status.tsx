// react
import React from "react";
// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
// ui
import { CustomSelect } from "components/ui";
// types
import { ICycle } from "types";
// common
// constants
import { CYCLE_STATUS } from "constants/cycle";

type Props = {
  control: Control<Partial<ICycle>, any>;
  submitChanges: (formData: Partial<ICycle>) => void;
  watch: UseFormWatch<Partial<ICycle>>;
};

export const CycleSidebarStatusSelect: React.FC<Props> = ({ control, submitChanges, watch }) => (
  <div className="flex flex-wrap items-center py-2">
    <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
      <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
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
                className={`flex items-center gap-2 text-left capitalize ${
                  value ? "" : "text-gray-900"
                }`}
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: CYCLE_STATUS?.find((option) => option.value === value)?.color,
                  }}
                />
                {watch("status")}
              </span>
            }
            value={value}
            onChange={(value: any) => {
              submitChanges({ status: value });
            }}
          >
            {CYCLE_STATUS.map((option) => (
              <CustomSelect.Option key={option.value} value={option.value}>
                <>
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        )}
      />
    </div>
  </div>
);
