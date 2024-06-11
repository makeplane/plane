"use client";

// react
import React from "react";
// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
import { IModule } from "@plane/types";
// ui
import { CustomSelect, DoubleCircleIcon } from "@plane/ui";
// types
import { MODULE_STATUS } from "@/constants/module";
// common
// constants

type Props = {
  control: Control<Partial<IModule>, any>;
  submitChanges: (formData: Partial<IModule>) => void;
  watch: UseFormWatch<Partial<IModule>>;
};

export const SidebarStatusSelect: React.FC<Props> = ({ control, submitChanges, watch }) => (
  <div className="flex flex-wrap items-center py-2">
    <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
      <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
      <p>Status</p>
    </div>
    <div className="sm:basis-1/2">
      <Controller
        control={control}
        name="status"
        render={({ field: { value } }) => (
          <CustomSelect
            label={
              <span className={`flex items-center gap-2 text-left capitalize ${value ? "" : "text-custom-text-100"}`}>
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: MODULE_STATUS?.find((option) => option.value === value)?.color,
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
            {MODULE_STATUS.map((option) => (
              <CustomSelect.Option key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
                  {option.label}
                </div>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        )}
      />
    </div>
  </div>
);
