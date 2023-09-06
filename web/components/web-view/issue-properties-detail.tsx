// react
import React from "react";

// react hook forms
import { Controller } from "react-hook-form";

// ui
import { Icon } from "components/ui";

// components
import { Label, StateSelect, PrioritySelect } from "components/web-view";

// types
import type { IIssue } from "types";

type Props = {
  control: any;
  submitChanges: (data: Partial<IIssue>) => Promise<void>;
};

export const IssuePropertiesDetail: React.FC<Props> = (props) => {
  const { control, submitChanges } = props;

  return (
    <div>
      <Label>Details</Label>
      <div className="space-y-2 mb-[6px]">
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
      <div className="space-y-2">
        <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Icon iconName="grid_view" />
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
    </div>
  );
};
