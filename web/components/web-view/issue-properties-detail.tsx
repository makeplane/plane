// react
import React, { useState } from "react";

// react hook forms
import { Control, Controller } from "react-hook-form";

// icons
import { ChevronDownIcon, PlayIcon } from "lucide-react";

// hooks
import useEstimateOption from "hooks/use-estimate-option";

// ui
import { Icon, SecondaryButton } from "components/ui";

// components
import {
  Label,
  StateSelect,
  PrioritySelect,
  AssigneeSelect,
  EstimateSelect,
} from "components/web-view";

// types
import type { IIssue } from "types";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (data: Partial<IIssue>) => Promise<void>;
};

export const IssuePropertiesDetail: React.FC<Props> = (props) => {
  const { control, submitChanges } = props;

  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const { isEstimateActive } = useEstimateOption();

  return (
    <div>
      <Label>Details</Label>
      <div className="mb-[6px]">
        <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Icon iconName="grid_view" />
            <span className="text-sm text-custom-text-200">State</span>
          </div>
          <div>
            <Controller
              control={control}
              name="state"
              render={({ field: { value } }) => (
                <StateSelect
                  value={value}
                  onChange={(val: string) => submitChanges({ state: val })}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="mb-[6px]">
        <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Icon iconName="signal_cellular_alt" />
            <span className="text-sm text-custom-text-200">Priority</span>
          </div>
          <div>
            <Controller
              control={control}
              name="priority"
              render={({ field: { value } }) => (
                <PrioritySelect
                  value={value}
                  onChange={(val: string) => submitChanges({ priority: val })}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="mb-[6px]">
        <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Icon iconName="person" />
            <span className="text-sm text-custom-text-200">Assignee</span>
          </div>
          <div>
            <Controller
              control={control}
              name="assignees_list"
              render={({ field: { value } }) => (
                <AssigneeSelect
                  value={value}
                  onChange={(val: string) => submitChanges({ assignees_list: [val] })}
                />
              )}
            />
          </div>
        </div>
      </div>
      {isViewAllOpen && (
        <>
          {isEstimateActive && (
            <div className="mb-[6px]">
              <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <PlayIcon className="h-4 w-4 flex-shrink-0 -rotate-90" />
                  <span className="text-sm text-custom-text-200">Estimate</span>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="estimate_point"
                    render={({ field: { value } }) => (
                      <EstimateSelect
                        value={value}
                        onChange={(val) => submitChanges({ estimate_point: val })}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div className="mb-[6px]">
        <SecondaryButton
          type="button"
          onClick={() => setIsViewAllOpen((prev) => !prev)}
          className="w-full flex justify-center items-center gap-1 !py-2"
        >
          <span className="text-base text-custom-primary-100">
            {isViewAllOpen ? "View less" : "View all"}
          </span>
          <ChevronDownIcon
            size={16}
            className={`ml-1 text-custom-primary-100 ${isViewAllOpen ? "-rotate-180" : ""}`}
          />
        </SecondaryButton>
      </div>
    </div>
  );
};
