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
  value: string;
  onChange: (value: string) => void;
};

type DueDate = {
  name: string;
  value: string;
  icon: any;
}

const dueDateRange: DueDate[] = [
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


export const DueDateFilterSelect: React.FC<Props> = ({ value, onChange }) =>
    <CustomSelect
      value={value ?? "before"}
      label={
        <div className="flex items-center gap-2 text-xs">
          {dueDateRange.find((item)=> item.value === value)?.icon}
          <span className={value !== null ? "text-brand-base" : "text-brand-secondary"}>
            {dueDateRange.find((item)=> item.value === value)?.name}
          </span>
        </div>
      }
      onChange={onChange}
      position="right"
      width="w-full min-w-[8rem]"
      noChevron
    >
      {dueDateRange.map((option, index) => (
        <CustomSelect.Option key={index} value={option.value} >
          <>
            <span>{option.icon}</span>
            {option.name}
          </>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
