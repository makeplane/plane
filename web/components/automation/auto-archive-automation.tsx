import React, { useState } from "react";

// component
import { CustomSelect } from "components/ui";
import { ToggleSwitch } from "@plane/ui";
import { SelectMonthModal } from "components/automation";
// icon
import { ArchiveRestore } from "lucide-react";
// constants
import { PROJECT_AUTOMATION_MONTHS } from "constants/project";
// types
import { IProject } from "types";

type Props = {
  projectDetails: IProject | undefined;
  handleChange: (formData: Partial<IProject>) => Promise<void>;
  disabled?: boolean;
};

export const AutoArchiveAutomation: React.FC<Props> = ({ projectDetails, handleChange, disabled = false }) => {
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
      <div className="flex flex-col gap-4 border-b border-custom-border-200 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center p-3 rounded bg-custom-background-90">
              <ArchiveRestore className="h-4 w-4 text-custom-text-100 flex-shrink-0" />
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
              projectDetails?.archive_in === 0 ? handleChange({ archive_in: 1 }) : handleChange({ archive_in: 0 })
            }
            size="sm"
            disabled={disabled}
          />
        </div>

        {projectDetails?.archive_in !== 0 && (
          <div className="ml-12">
            <div className="flex items-center justify-between rounded px-5 py-4 bg-custom-background-90 border border-custom-border-200 gap-2 w-full">
              <div className="w-1/2 text-sm font-medium">Auto-archive issues that are closed for</div>
              <div className="w-1/2">
                <CustomSelect
                  value={projectDetails?.archive_in}
                  label={`${projectDetails?.archive_in} ${projectDetails?.archive_in === 1 ? "Month" : "Months"}`}
                  onChange={(val: number) => {
                    handleChange({ archive_in: val });
                  }}
                  input
                  width="w-full"
                  disabled={disabled}
                >
                  <>
                    {PROJECT_AUTOMATION_MONTHS.map((month) => (
                      <CustomSelect.Option key={month.label} value={month.value}>
                        <span className="text-sm">{month.label}</span>
                      </CustomSelect.Option>
                    ))}

                    <button
                      type="button"
                      className="flex w-full text-sm select-none items-center rounded px-1 py-1.5 text-custom-text-200 hover:bg-custom-background-80"
                      onClick={() => setmonthModal(true)}
                    >
                      Customise Time Range
                    </button>
                  </>
                </CustomSelect>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
