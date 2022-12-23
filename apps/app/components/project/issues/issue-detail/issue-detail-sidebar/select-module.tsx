// react
import React from "react";
// react-hook-form
import { Control, Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Spinner, CustomSelect } from "ui";
// icons
import { RectangleGroupIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IModule } from "types";
// common
import { classNames } from "constants/common";

type Props = {
  control: Control<IIssue, any>;
  handleModuleChange: (module: IModule) => void;
};

const SelectModule: React.FC<Props> = ({ control, handleModuleChange }) => {
  const { modules } = useUser();

  return (
    <div className="flex items-center py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <RectangleGroupIcon className="flex-shrink-0 h-4 w-4" />
        <p>Module</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="issue_module"
          render={({ field: { value } }) => (
            <CustomSelect
              label={
                <span
                  className={classNames(
                    value ? "" : "text-gray-900",
                    "hidden truncate sm:block text-left"
                  )}
                >
                  {value && value.length > 0
                    ? modules?.find((m) => m.id === value[0]?.module_detail.id)?.name
                    : "None"}
                </span>
              }
              value={value}
              onChange={(value: any) => {
                handleModuleChange(modules?.find((m) => m.id === value) as any);
              }}
            >
              {modules ? (
                modules.length > 0 ? (
                  modules.map((option) => (
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
          )}
        />
      </div>
    </div>
  );
};

export default SelectModule;
