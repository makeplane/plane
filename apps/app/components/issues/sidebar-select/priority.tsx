import React from "react";

// ui
import { CustomSelect } from "components/ui";
// icons
import { getPriorityIcon } from "components/icons/priority-icon";
// constants
import { PRIORITIES } from "constants/project";

type Props = {
  value: string | null;
  onChange: (val: string) => void;
  disabled?: boolean;
};

export const SidebarPrioritySelect: React.FC<Props> = ({ value, onChange, disabled = false }) => (
  <CustomSelect
    label={
      <div className="flex items-center gap-2 text-left capitalize">
        <span className={`${value ? "text-custom-text-100" : "text-custom-text-200"}`}>
          {getPriorityIcon(value ?? "None", "text-sm")}
        </span>
        <span className={`${value ? "text-custom-text-100" : "text-custom-text-200"}`}>
          {value ?? "None"}
        </span>
      </div>
    }
    value={value}
    onChange={onChange}
    width="w-full"
    position="right"
    disabled={disabled}
  >
    {PRIORITIES.map((option) => (
      <CustomSelect.Option key={option} value={option} className="capitalize">
        <>
          {getPriorityIcon(option, "text-sm")}
          {option ?? "None"}
        </>
      </CustomSelect.Option>
    ))}
  </CustomSelect>
);
