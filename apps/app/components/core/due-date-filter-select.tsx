import React, { useState } from "react";

// ui
import { CustomSelect } from "components/ui";
// icons
import {
  CalendarBeforeIcon,
  CalendarAfterIcon,
  CalendarMonthIcon,
} from "components/icons";
// fetch-keys

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const dueDateRange = [
  {
    name: "Due Date Before",
    value: "before",
    icon: <CalendarBeforeIcon className="h-4 w-4 " />,
  },
  {
    name: "Due Date After",
    value: "after",
    icon: <CalendarAfterIcon className="h-4 w-4 " />,
  },
  {
    name: "Due Date Range",
    value: "range",
    icon: <CalendarMonthIcon className="h-4 w-4 " />,
  }
];

export const DueDateFilterSelect: React.FC<Props> = ({ value, onChange }) => {
  const [state, setState] = useState();
  return (
    <CustomSelect
      value={value ?? 0}
      label={
        <div className="flex items-center gap-2 text-xs">
          {dueDateRange[value]?.icon}
          <span className={value !== null ? "text-brand-base" : "text-brand-secondary"}>
            {dueDateRange[value]?.name}
          </span>
        </div>
      }
      onChange={onChange}
      position="right"
      width="w-full min-w-[8rem]"
      noChevron
    >
      {dueDateRange.map((option, index) => (
        <CustomSelect.Option key={index} value={index} >
          <>
            <span>{option.icon}</span>
            {option.name}
          </>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
