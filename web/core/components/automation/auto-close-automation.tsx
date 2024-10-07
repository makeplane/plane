"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
// icons
import { ArchiveX } from "lucide-react";
// types
import { IProject } from "@plane/types";
// ui
import { CustomSelect, CustomSearchSelect, ToggleSwitch, StateGroupIcon, DoubleCircleIcon, Loader } from "@plane/ui";
// component
import { SelectMonthModal } from "@/components/automation";
// constants
import { PROJECT_AUTOMATION_MONTHS } from "@/constants/project";
// hooks
import { useProject, useProjectState, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const AutoCloseAutomation: React.FC<Props> = observer((props) => {
  const { handleChange } = props;
  // states
  const [monthModal, setmonthModal] = useState(false);
  // store hooks
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { allowPermissions } = useUserPermissions();

  // const stateGroups = projectStateStore.groupedProjectStates ?? undefined;

  const options = projectStates
    ?.filter((state) => state.group === "cancelled")
    .map((state) => ({
      value: state.id,
      query: state.name,
      content: (
        <div className="flex items-center gap-2">
          <StateGroupIcon stateGroup={state.group} color={state.color} height="16px" width="16px" />
          {state.name}
        </div>
      ),
    }));

  const multipleOptions = (options ?? []).length > 1;

  const defaultState = projectStates?.find((s) => s.group === "cancelled")?.id || null;

  const selectedOption = projectStates?.find((s) => s.id === (currentProjectDetails?.default_state ?? defaultState));
  const currentDefaultState = projectStates?.find((s) => s.id === defaultState);

  const initialValues: Partial<IProject> = {
    close_in: 1,
    default_state: defaultState,
  };

  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    currentProjectDetails?.workspace_detail?.slug,
    currentProjectDetails?.id
  );

  return (
    <>
      <SelectMonthModal
        type="auto-close"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />
      <div className="flex flex-col gap-4 border-b border-custom-border-200 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded bg-custom-background-90 p-3">
              <ArchiveX className="h-4 w-4 flex-shrink-0 text-red-500" />
            </div>
            <div className="">
              <h4 className="text-sm font-medium">Auto-close issues</h4>
              <p className="text-sm tracking-tight text-custom-text-200">
                Plane will automatically close issues that haven{"'"}t been completed or canceled.
              </p>
            </div>
          </div>
          <ToggleSwitch
            value={currentProjectDetails?.close_in !== 0}
            onChange={() =>
              currentProjectDetails?.close_in === 0
                ? handleChange({ close_in: 1, default_state: defaultState })
                : handleChange({ close_in: 0, default_state: null })
            }
            size="sm"
            disabled={!isAdmin}
          />
        </div>

        {currentProjectDetails ? (
          currentProjectDetails.close_in !== 0 && (
            <div className="mx-6">
              <div className="flex flex-col rounded border border-custom-border-200 bg-custom-background-90">
                <div className="flex w-full items-center justify-between gap-2 px-5 py-4">
                  <div className="w-1/2 text-sm font-medium">Auto-close issues that are inactive for</div>
                  <div className="w-1/2">
                    <CustomSelect
                      value={currentProjectDetails?.close_in}
                      label={`${currentProjectDetails?.close_in} ${
                        currentProjectDetails?.close_in === 1 ? "month" : "months"
                      }`}
                      onChange={(val: number) => {
                        handleChange({ close_in: val });
                      }}
                      input
                      disabled={!isAdmin}
                    >
                      <>
                        {PROJECT_AUTOMATION_MONTHS.map((month) => (
                          <CustomSelect.Option key={month.label} value={month.value}>
                            {month.label}
                          </CustomSelect.Option>
                        ))}
                        <button
                          type="button"
                          className="flex w-full select-none items-center rounded px-1 py-1.5 text-custom-text-200 hover:bg-custom-background-80"
                          onClick={() => setmonthModal(true)}
                        >
                          Customize time range
                        </button>
                      </>
                    </CustomSelect>
                  </div>
                </div>

                <div className="flex w-full items-center justify-between gap-2 px-5 py-4">
                  <div className="w-1/2 text-sm font-medium">Auto-close status</div>
                  <div className="w-1/2 ">
                    <CustomSearchSelect
                      value={currentProjectDetails?.default_state ?? defaultState}
                      label={
                        <div className="flex items-center gap-2">
                          {selectedOption ? (
                            <StateGroupIcon
                              stateGroup={selectedOption.group}
                              color={selectedOption.color}
                              height="16px"
                              width="16px"
                            />
                          ) : currentDefaultState ? (
                            <StateGroupIcon
                              stateGroup={currentDefaultState.group}
                              color={currentDefaultState.color}
                              height="16px"
                              width="16px"
                            />
                          ) : (
                            <DoubleCircleIcon className="h-3.5 w-3.5 text-custom-text-200" />
                          )}
                          {selectedOption?.name
                            ? selectedOption.name
                            : (currentDefaultState?.name ?? <span className="text-custom-text-200">State</span>)}
                        </div>
                      }
                      onChange={(val: string) => {
                        handleChange({ default_state: val });
                      }}
                      options={options}
                      disabled={!multipleOptions}
                      input
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <Loader className="mx-6">
            <Loader.Item height="50px" />
          </Loader>
        )}
      </div>
    </>
  );
});
