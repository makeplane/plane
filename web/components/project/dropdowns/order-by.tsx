import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";
// ui
import { CustomMenu, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TProjectOrderByOptions } from "@plane/types";
// constants
import { PROJECT_ORDER_BY_OPTIONS } from "constants/project";

type Props = {
  onChange: (value: TProjectOrderByOptions) => void;
  value: TProjectOrderByOptions | undefined;
};

export const ProjectOrderByDropdown: React.FC<Props> = (props) => {
  const { onChange, value } = props;

  const orderByDetails = PROJECT_ORDER_BY_OPTIONS.find((option) => value?.includes(option.key));

  return (
    <CustomMenu
      customButton={
        <div className={cn(getButtonStyling("neutral-primary", "sm"), "px-2 text-custom-text-300")}>
          <ArrowDownWideNarrow className="h-3 w-3" />
          {orderByDetails?.label}
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </div>
      }
      placement="bottom-end"
      closeOnSelect
    >
      {PROJECT_ORDER_BY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => onChange(option.key)}
        >
          {option.label}
          {value?.includes(option.key) && <Check className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2" />
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (value?.[0] === "-") onChange(value.slice(1) as TProjectOrderByOptions);
        }}
        disabled={value === "sort_order"}
      >
        Ascending
        {value?.[0] !== "-" && <Check className="h-3 w-3" />}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (value?.[0] !== "-") onChange(`-${value}` as TProjectOrderByOptions);
        }}
        disabled={value === "sort_order"}
      >
        Descending
        {value?.[0] === "-" && <Check className="h-3 w-3" />}
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
};
