import React from "react";
// swr
import useSWR from "swr";
// react-hook-form
import { Control, Controller } from "react-hook-form";
// services
import stateService from "lib/services/state.service";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { classNames } from "constants/common";
import { STATE_LIST } from "constants/fetch-keys";
// types
import { IIssue } from "types";
// ui
import { Spinner, CustomSelect } from "ui";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
};

const SelectState: React.FC<Props> = ({ control, submitChanges }) => {
  const { activeWorkspace, activeProject } = useUser();

  const { data: states } = useSWR(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateService.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
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
                        className="h-2 w-2 flex-shrink-0 rounded-full"
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
                            className="h-2 w-2 flex-shrink-0 rounded-full"
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
