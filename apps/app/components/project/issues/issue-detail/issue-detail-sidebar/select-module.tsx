import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { Control, Controller } from "react-hook-form";
// constants
import { RectangleGroupIcon } from "@heroicons/react/24/outline";
// services
import modulesService from "services/modules.service";
// ui
import { Spinner, CustomSelect } from "components/ui";
// icons
// types
import { IIssue, IModule } from "types";
import { MODULE_LIST } from "constants/fetch-keys";

type Props = {
  control: Control<IIssue, any>;
  handleModuleChange: (module: IModule) => void;
};

const SelectModule: React.FC<Props> = ({ control, handleModuleChange }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: modules } = useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => modulesService.getModules(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <RectangleGroupIcon className="h-4 w-4 flex-shrink-0" />
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
                  className={`hidden truncate text-left sm:block ${value ? "" : "text-gray-900"}`}
                >
                  {value ? modules?.find((m) => m.id === value?.module_detail.id)?.name : "None"}
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
