import React, { useState } from "react";

import useSWR from "swr";

import { useRouter } from "next/router";

// component
import { CustomSearchSelect, CustomSelect, ToggleSwitch } from "components/ui";
import { SelectMonthModal } from "components/automation";
// icons
import { ChevronDownIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { getStateGroupIcon } from "components/icons";
// services
import stateService from "services/state.service";
// constants
import { PROJECT_AUTOMATION_MONTHS } from "constants/project";
import { STATES_LIST } from "constants/fetch-keys";
// types
import { IProject } from "types";
// helper
import { getStatesList } from "helpers/state.helper";

type Props = {
  projectDetails: IProject | undefined;
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const AutoCloseAutomation: React.FC<Props> = ({ projectDetails, handleChange }) => {
  const [monthModal, setmonthModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  const states = getStatesList(stateGroups ?? {});

  const options = states
    ?.filter((state) => state.group === "cancelled")
    .map((state) => ({
      value: state.id,
      query: state.name,
      content: (
        <div className="flex items-center gap-2">
          {getStateGroupIcon(state.group, "16", "16", state.color)}
          {state.name}
        </div>
      ),
    }));

  const multipleOptions = options.length > 1;

  const defaultState = stateGroups && stateGroups.cancelled ? stateGroups.cancelled[0].id : null;

  const selectedOption = states?.find(
    (s) => s.id === projectDetails?.default_state ?? defaultState
  );
  const currentDefaultState = states.find((s) => s.id === defaultState);

  const initialValues: Partial<IProject> = {
    close_in: 1,
    default_state: defaultState,
  };

  return (
    <>
      <SelectMonthModal
        type="auto-close"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />

      <div className="flex flex-col gap-7 px-6 py-5 rounded-[10px] border border-brand-base bg-brand-base">
        <div className="flex items-center justify-between gap-x-8 gap-y-2 ">
          <div className="flex flex-col gap-2.5">
            <h4 className="text-lg font-semibold">Auto-close inactive issues</h4>
            <p className="text-sm text-brand-secondary">
              Plane will automatically close the issues that have not been updated for the
              configured time period.
            </p>
          </div>
          <ToggleSwitch
            value={projectDetails?.close_in !== 0}
            onChange={() =>
              projectDetails?.close_in === 0
                ? handleChange({ close_in: 1, default_state: defaultState })
                : handleChange({ close_in: 0, default_state: null })
            }
            size="sm"
          />
        </div>
        {projectDetails?.close_in !== 0 && (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="w-1/2 text-base font-medium">
                Auto-close issues that are inactive for
              </div>
              <div className="w-1/2 ">
                <CustomSelect
                  value={projectDetails?.close_in}
                  customButton={
                    <button className="flex w-full items-center justify-between gap-1 rounded-md border border-brand-base shadow-sm duration-300 text-brand-secondary hover:text-brand-base hover:bg-brand-surface-2 focus:outline-none px-3 py-2 text-sm text-left">
                      {`${projectDetails?.close_in} ${
                        projectDetails?.close_in === 1 ? "Month" : "Months"
                      }`}
                      <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                    </button>
                  }
                  onChange={(val: number) => {
                    handleChange({ close_in: val });
                  }}
                  input
                  width="w-full"
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
                      Customize Time Range
                    </button>
                  </>
                </CustomSelect>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="w-1/2 text-base font-medium">Auto-close Status</div>
              <div className="w-1/2 ">
                <CustomSearchSelect
                  value={
                    projectDetails?.default_state ? projectDetails?.default_state : defaultState
                  }
                  customButton={
                    <button
                      className={`flex w-full items-center justify-between gap-1 rounded-md border border-brand-base shadow-sm duration-300 text-brand-secondary hover:text-brand-base hover:bg-brand-surface-2 focus:outline-none px-3 py-2 text-sm text-left ${
                        !multipleOptions ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedOption ? (
                          getStateGroupIcon(selectedOption.group, "16", "16", selectedOption.color)
                        ) : currentDefaultState ? (
                          getStateGroupIcon(
                            currentDefaultState.group,
                            "16",
                            "16",
                            currentDefaultState.color
                          )
                        ) : (
                          <Squares2X2Icon className="h-3.5 w-3.5 text-custom-text-200" />
                        )}
                        {selectedOption?.name
                          ? selectedOption.name
                          : currentDefaultState?.name ?? (
                              <span className="text-custom-text-200">State</span>
                            )}
                      </div>
                      {multipleOptions && (
                        <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                      )}
                    </button>
                  }
                  onChange={(val: string) => {
                    handleChange({ default_state: val });
                  }}
                  options={options}
                  disabled={!multipleOptions}
                  dropdownWidth="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
