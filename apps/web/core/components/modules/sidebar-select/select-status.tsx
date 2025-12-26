// react
import React from "react";
// react-hook-form
import type { Control, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { StatePropertyIcon } from "@plane/propel/icons";
import type { IModule } from "@plane/types";
// ui
import { CustomSelect } from "@plane/ui";
// types
// common
// constants

type Props = {
  control: Control<Partial<IModule>, any>;
  submitChanges: (formData: Partial<IModule>) => void;
  watch: UseFormWatch<Partial<IModule>>;
};

export function SidebarStatusSelect({ control, submitChanges, watch }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-13 sm:basis-1/2">
        <StatePropertyIcon className="h-4 w-4 flex-shrink-0" />
        <p>Status</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="status"
          render={({ field: { value } }) => (
            <CustomSelect
              label={
                <span className={`flex items-center gap-2 text-left capitalize ${value ? "" : "text-primary"}`}>
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
                    {t(option.i18n_label)}
                  </div>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      </div>
    </div>
  );
}
