import React, { useState } from "react";

// component
import { CustomSelect, ToggleSwitch } from "components/ui";
import { SelectMonthModal } from "components/automation";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// constants
import { PROJECT_AUTOMATION_MONTHS } from "constants/project";
// types
import { IProject } from "types";

type Props = {
  projectDetails: IProject | undefined;
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export const AutoArchiveAutomation: React.FC<Props> = ({ projectDetails, handleChange }) => {
  const [monthModal, setmonthModal] = useState(false);

  const initialValues: Partial<IProject> = { archive_in: 1 };
  return (
    <>
      <SelectMonthModal
        type="auto-archive"
        initialValues={initialValues}
        isOpen={monthModal}
        handleClose={() => setmonthModal(false)}
        handleChange={handleChange}
      />
      <div className="flex flex-col gap-7 px-6 py-5 rounded-[10px] border border-custom-border-300 bg-custom-background-90">
        <div className="flex items-center justify-between gap-x-8 gap-y-2">
          <div className="flex flex-col gap-2.5">
            <h4 className="text-lg font-semibold">Auto-archive closed issues</h4>
            <p className="text-sm text-custom-text-200">
              Plane will automatically archive issues that have been completed or cancelled for the
              configured time period.
            </p>
          </div>
          <ToggleSwitch
            value={projectDetails?.archive_in !== 0}
            onChange={() =>
              projectDetails?.archive_in === 0
                ? handleChange({ archive_in: 1 })
                : handleChange({ archive_in: 0 })
            }
            size="sm"
          />
        </div>
        {projectDetails?.archive_in !== 0 && (
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="w-1/2 text-base font-medium">
              Auto-archive issues that are closed for
            </div>
            <div className="w-1/2">
              <CustomSelect
                value={projectDetails?.archive_in}
                label={`${projectDetails?.archive_in} ${
                  projectDetails?.archive_in === 1 ? "Month" : "Months"
                }`}
                onChange={(val: number) => {
                  handleChange({ archive_in: val });
                }}
                input
                verticalPosition="top"
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
        )}
      </div>
    </>
  );
};
