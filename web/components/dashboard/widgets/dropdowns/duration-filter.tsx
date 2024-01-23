import { ChevronDown } from "lucide-react";
// ui
import { CustomMenu } from "@plane/ui";
// types
import { TDurationFilterOptions } from "@plane/types";
// constants
import { DURATION_FILTER_OPTIONS } from "constants/dashboard";

type Props = {
  onChange: (value: TDurationFilterOptions) => void;
  value: TDurationFilterOptions;
};

export const DurationFilterDropdown: React.FC<Props> = (props) => {
  const { onChange, value } = props;

  return (
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
  );
};
