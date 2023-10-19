import React from "react";

// ui
import { CustomSelect, PriorityIcon } from "@plane/ui";
// types
import { TIssuePriorities } from "types";
// constants
import { PRIORITIES } from "constants/project";

type Props = {
  value: TIssuePriorities;
  onChange: (value: string) => void;
};

export const IssuePrioritySelect: React.FC<Props> = ({ value, onChange }) => (
  <CustomSelect
    value={value}
    label={
      <div className="flex items-center justify-center gap-2 text-xs">
        <span className="flex items-center">
          <PriorityIcon priority={value} className={`h-3.5 w-3.5 ${value ? "" : "text-custom-text-200"}`} />
        </span>
        <span className={`${value ? "" : "text-custom-text-200"} capitalize`}>{value ?? "Priority"}</span>
      </div>
    }
    onChange={onChange}
    noChevron
  >
    {PRIORITIES.map((priority) => (
      <CustomSelect.Option key={priority} value={priority}>
        <div className="flex w-full justify-between gap-2 rounded">
          <div className="flex items-center justify-start gap-2">
            <span>
              <PriorityIcon priority={priority} />
            </span>
            <span className="capitalize">{priority}</span>
          </div>
        </div>
      </CustomSelect.Option>
    ))}
  </CustomSelect>
);
