import React from "react";

// ui
import { CustomSelect, CalendarAfterIcon, CalendarBeforeIcon } from "@plane/ui";
// icons
import { CalendarDays } from "lucide-react";
// fetch-keys

type Props = {
  title: string;
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
    name: "before",
    value: "before",
    icon: <CalendarBeforeIcon className="h-4 w-4 " />,
  },
  {
    name: "after",
    value: "after",
    icon: <CalendarAfterIcon className="h-4 w-4 " />,
  },
  {
    name: "range",
    value: "range",
    icon: <CalendarDays className="h-4 w-4 " />,
  },
];

export const DateFilterSelect: React.FC<Props> = ({ title, value, onChange }) => (
  <CustomSelect
    value={value}
    label={
      <div className="flex items-center gap-2 text-xs">
        {dueDateRange.find((item) => item.value === value)?.icon}
        <span>
          {title} {dueDateRange.find((item) => item.value === value)?.name}
        </span>
      </div>
    }
    onChange={onChange}
  >
    {dueDateRange.map((option, index) => (
      <CustomSelect.Option key={index} value={option.value}>
        <>
          <span>{option.icon}</span>
          {title} {option.name}
        </>
      </CustomSelect.Option>
    ))}
  </CustomSelect>
);
