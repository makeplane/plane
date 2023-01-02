import React from "react";
// swr
import useSWR from "swr";
// react-hook-form
import { Control, Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { CYCLE_LIST } from "constants/fetch-keys";
// services
import cyclesService from "lib/services/cycles.service";
// ui
import { Spinner, CustomSelect } from "ui";
// icons
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// types
import { ICycle, IIssue } from "types";
// common
import { classNames } from "constants/common";

type Props = {
  control: Control<IIssue, any>;
  handleCycleChange: (cycle: ICycle) => void;
};

const SelectCycle: React.FC<Props> = ({ control, handleCycleChange }) => {
  const { activeWorkspace, activeProject } = useUser();

  const { data: cycles } = useSWR(
    activeWorkspace && activeProject ? CYCLE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => cyclesService.getCycles(activeWorkspace.slug, activeProject.id)
      : null
  );

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <ArrowPathIcon className="h-4 w-4 flex-shrink-0" />
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
                      "hidden truncate text-left sm:block"
                    )}
                  >
                    {value ? cycles?.find((c) => c.id === value.cycle_detail.id)?.name : "None"}
                  </span>
                }
                value={value}
                onChange={(value: any) => {
                  handleCycleChange(cycles?.find((c) => c.id === value) as any);
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
