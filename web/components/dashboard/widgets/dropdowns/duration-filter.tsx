import { useState } from "react";
import { ChevronDown } from "lucide-react";
// components
import { DateFilterModal } from "components/core";
// ui
import { CustomMenu } from "@plane/ui";
// helpers
import { getDurationFilterDropdownLabel } from "helpers/dashboard.helper";
// types
<<<<<<< HEAD
import { DURATION_FILTER_OPTIONS } from "constants/dashboard";
import { TDurationFilterOptions } from "@plane/types";
=======
import { EDurationFilters } from "@plane/types";
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
// constants

type Props = {
  customDates?: string[];
  onChange: (value: EDurationFilters, customDates?: string[]) => void;
  value: EDurationFilters;
};

export const DurationFilterDropdown: React.FC<Props> = (props) => {
  const { customDates, onChange, value } = props;
  // states
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);

  return (
<<<<<<< HEAD
    <CustomMenu
      className="flex-shrink-0"
      customButton={
        <div className="px-3 py-2 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 focus:bg-custom-background-80 text-xs font-medium whitespace-nowrap rounded-md outline-none flex items-center gap-2">
          {DURATION_FILTER_OPTIONS.find((option) => option.key === value)?.label}
          <ChevronDown className="h-3 w-3" />
        </div>
      }
      placement="bottom-end"
      closeOnSelect
    >
      {DURATION_FILTER_OPTIONS.map((option) => (
        <CustomMenu.MenuItem key={option.key} onClick={() => onChange(option.key)}>
          {option.label}
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
=======
    <>
      <DateFilterModal
        isOpen={isDateFilterModalOpen}
        handleClose={() => setIsDateFilterModalOpen(false)}
        onSelect={(val) => onChange(EDurationFilters.CUSTOM, val)}
        title="Due date"
      />
      <CustomMenu
        className="flex-shrink-0"
        customButton={
          <div className="px-3 py-2 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 focus:bg-custom-background-80 text-xs font-medium whitespace-nowrap rounded-md outline-none flex items-center gap-2">
            {getDurationFilterDropdownLabel(value, customDates ?? [])}
            <ChevronDown className="h-3 w-3" />
          </div>
        }
        placement="bottom-end"
        closeOnSelect
      >
        {DURATION_FILTER_OPTIONS.map((option) => (
          <CustomMenu.MenuItem
            key={option.key}
            onClick={() => {
              if (option.key === "custom") setIsDateFilterModalOpen(true);
              else onChange(option.key);
            }}
          >
            {option.label}
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
>>>>>>> 921b9078f1e18a034934f2ddc89e736fc38cffe4
  );
};
