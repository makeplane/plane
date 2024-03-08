import { ArrowDownUp, Check, ChevronDown } from "lucide-react";
// ui
import { CustomMenu, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TCycleOrderByOptions } from "@plane/types";
// constants
import { CYCLE_ORDER_BY_OPTIONS } from "constants/cycle";

type Props = {
  onChange: (value: TCycleOrderByOptions) => void;
  value: TCycleOrderByOptions | undefined;
};

export const OrderByDropdown: React.FC<Props> = (props) => {
  const { onChange, value } = props;

  const orderByDetails = CYCLE_ORDER_BY_OPTIONS.find((option) => value?.includes(option.key));

  return (
    <CustomMenu
      customButton={
        <div className={cn(getButtonStyling("neutral-primary", "sm"), "px-2 text-custom-text-300")}>
          <ArrowDownUp className="h-3 w-3" />
          {orderByDetails?.label}
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </div>
      }
      placement="bottom-end"
      closeOnSelect
    >
      {CYCLE_ORDER_BY_OPTIONS.map((option) => (
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
          if (value?.[0] === "-") onChange(value.slice(1) as TCycleOrderByOptions);
        }}
      >
        Ascending
        {value?.[0] !== "-" && <Check className="h-3 w-3" />}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem
        className="flex items-center justify-between gap-2"
        onClick={() => {
          if (value?.[0] !== "-") onChange(`-${value}` as TCycleOrderByOptions);
        }}
      >
        Descending
        {value?.[0] === "-" && <Check className="h-3 w-3" />}
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
};
