import React from "react";

// ui
import { CustomSelect } from "components/ui";
// icons
import { CalendarBeforeIcon, CalendarAfterIcon, CalendarMonthIcon } from "components/icons";
// fetch-keys

type Props = {
  value: string;
  onChange: (value: string) => void;
};

type DueDate = {
  name: string;
  value: string;
  icon: any;
};

const dueDateRange: DueDate[] = [
  {
    name: "Due date before",
    value: "before",
    icon: <CalendarBeforeIcon className="h-4 w-4 " />,
  },
  {
    name: "Due date after",
    value: "after",
    icon: <CalendarAfterIcon className="h-4 w-4 " />,
  },
  {
    name: "Due date range",
    value: "range",
    icon: <CalendarMonthIcon className="h-4 w-4 " />,
  },
];

export const DueDateFilterSelect: React.FC<Props> = ({ value, onChange }) => (
  <CustomSelect
    value={value}
    label={
      <div className="flex items-center gap-2 text-xs">
        {dueDateRange.find((item) => item.value === value)?.icon}
        <span>{dueDateRange.find((item) => item.value === value)?.name}</span>
      </div>
    }
    onChange={onChange}
  >
    {dueDateRange.map((option, index) => (
      <CustomSelect.Option key={index} value={option.value}>
        <>
          <span>{option.icon}</span>
          {option.name}
        </>
      </CustomSelect.Option>
    ))}
  </CustomSelect>
);
