import React, { useState } from "react";

// component
import { CustomSelect, Icon, ToggleSwitch } from "components/ui";
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
      <div className="flex items-center justify-between gap-x-8 gap-y-2 border-b border-custom-border-200 bg-custom-background-100 p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center p-2.5 rounded bg-custom-background-90">
            <Icon iconName="tab_close_right" className="text-xl leading-5" />
          </div>
          <div className="">
            <h4 className="text-sm font-medium">Auto-archive closed issues</h4>
            <p className="text-sm text-custom-text-200 tracking-tight">
              Plane will auto archive issues that have been completed or canceled.
            </p>
          </div>
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
