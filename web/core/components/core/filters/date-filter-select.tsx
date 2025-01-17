"use client";
import React from "react";
import { CalendarDays } from "lucide-react";
// ui
import { useTranslation } from "@plane/i18n";
import { CustomSelect, CalendarAfterIcon, CalendarBeforeIcon } from "@plane/ui";

type Props = {
  title: string;
  value: string;
  onChange: (value: string) => void;
};

type DueDate = {
  nameTranslationKey: string;
  name: string;
  value: string;
  icon: any;
};

const dueDateRange: DueDate[] = [
  {
    nameTranslationKey: "before",
    name: "before",
    value: "before",
    icon: <CalendarBeforeIcon className="h-4 w-4" />,
  },
  {
    nameTranslationKey: "after",
    name: "after",
    value: "after",
    icon: <CalendarAfterIcon className="h-4 w-4" />,
  },
  {
    nameTranslationKey: "range",
    name: "range",
    value: "range",
    icon: <CalendarDays className="h-4 w-4" />,
  },
];

export const DateFilterSelect: React.FC<Props> = ({ title, value, onChange }) => {
  const { t } = useTranslation();
  return (
    <CustomSelect
      value={value}
      label={
        <div className="flex items-center gap-2 text-xs">
          {dueDateRange.find((item) => item.value === value)?.icon}
          <span>
            {title} {t(dueDateRange.find((item) => item.value === value)?.nameTranslationKey || "select_date")}
          </span>
        </div>
      }
      onChange={onChange}
    >
      {dueDateRange.map((option, index) => (
        <CustomSelect.Option key={index} value={option.value}>
          <div className="flex items-center gap-2">
            <span>{option.icon}</span>
            {title} {t(option.nameTranslationKey)}
          </div>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
