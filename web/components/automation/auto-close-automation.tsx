import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// component
import { SelectMonthModal } from "components/automation";
import { CustomSelect, CustomSearchSelect, ToggleSwitch, StateGroupIcon, DoubleCircleIcon, Loader } from "@plane/ui";
// icons
import { ArchiveX } from "lucide-react";
// types
import { IProject } from "types";
// fetch keys
import { PROJECT_AUTOMATION_MONTHS } from "constants/project";
import { EUserWorkspaceRoles } from "constants/workspace";

type Props = {
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const AutoCloseAutomation: React.FC<Props> = observer((props) => {
  const { handleChange } = props;
  // states
  const [monthModal, setmonthModal] = useState(false);

  const { user: userStore, project: projectStore, projectState: projectStateStore } = useMobxStore();

  const userRole = userStore.currentProjectRole;
  const projectDetails = projectStore.currentProjectDetails;
  // const stateGroups = projectStateStore.groupedProjectStates ?? undefined;
  const states = projectStateStore.projectStates;

  const options = states
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

  const defaultState = states?.find((s) => s.group === "cancelled")?.id || null;

  const selectedOption = states?.find((s) => s.id === projectDetails?.default_state ?? defaultState);
  const currentDefaultState = states?.find((s) => s.id === defaultState);

  const initialValues: Partial<IProject> = {
    close_in: 1,
    default_state: defaultState,
  };

  const isAdmin = userRole === EUserWorkspaceRoles.ADMIN;

  return (
    <>
      <SelectMonthModal
        type="auto-close"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />
      <div className="flex flex-col gap-4 border-b border-custom-border-200 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center p-3 rounded bg-custom-background-90">
              <ArchiveX className="h-4 w-4 text-red-500 flex-shrink-0" />
            </div>
            <div className="">
              <h4 className="text-sm font-medium">Auto-close issues</h4>
              <p className="text-sm text-custom-text-200 tracking-tight">
                Plane will automatically close issue that haven{"'"}t been completed or cancelled.
              </p>
            </div>
          </div>
          <ToggleSwitch
            value={projectDetails?.close_in !== 0}
            onChange={() =>
              projectDetails?.close_in === 0
                ? handleChange({ close_in: 1, default_state: defaultState })
                : handleChange({ close_in: 0, default_state: null })
            }
            size="sm"
            disabled={!isAdmin}
          />
        </div>

        {projectDetails ? (
          projectDetails.close_in !== 0 && (
            <div className="ml-12">
              <div className="flex flex-col rounded bg-custom-background-90 border border-custom-border-200">
                <div className="flex items-center justify-between px-5 py-4 gap-2 w-full">
                  <div className="w-1/2 text-sm font-medium">Auto-close issues that are inactive for</div>
                  <div className="w-1/2">
                    <CustomSelect
                      value={projectDetails?.close_in}
                      label={`${projectDetails?.close_in} ${projectDetails?.close_in === 1 ? "Month" : "Months"}`}
                      onChange={(val: number) => {
                        handleChange({ close_in: val });
                      }}
                      input
                      width="w-full"
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
                          Customise Time Range
                        </button>
                      </>
                    </CustomSelect>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-4 gap-2 w-full">
                  <div className="w-1/2 text-sm font-medium">Auto-close Status</div>
                  <div className="w-1/2 ">
                    <CustomSearchSelect
                      value={projectDetails?.default_state ?? defaultState}
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
                            : currentDefaultState?.name ?? <span className="text-custom-text-200">State</span>}
                        </div>
                      }
                      onChange={(val: string) => {
                        handleChange({ default_state: val });
                      }}
                      options={options}
                      disabled={!multipleOptions}
                      width="w-full"
                      input
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <Loader className="ml-12">
            <Loader.Item height="50px" />
          </Loader>
        )}
      </div>
    </>
  );
});
