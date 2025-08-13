import React from "react";
import { Check, ChevronDown } from "lucide-react";
// helpers
import { cn } from "@plane/ui";
// types
import { ICustomSelectItemProps, ICustomSelectProps } from "@plane/ui";
import { Select } from "@base-ui-components/react/select";

const CustomSelect = (props: ICustomSelectProps) => {
  const {
    customButtonClassName = "",
    buttonClassName = "",
    placement,
    children,
    className = "",
    customButton,
    disabled = false,
    input = false,
    label,
    maxHeight = "md",
    noChevron = false,
    onChange,
    optionsClassName = "",
    value,
    tabIndex,
  } = props;
  // states
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <>
        {customButton ? (
          <Select.Trigger
            className={`outline-none flex items-center justify-between gap-1 text-xs ${
              disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
            } ${customButtonClassName}`}
          >
            {customButton}
          </Select.Trigger>
        ) : (
          <Select.Trigger
            className={cn(
              "outline-none flex w-full items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300",
              {
                "px-3 py-2 text-sm": input,
                "px-2 py-1 text-xs": !input,
                "cursor-not-allowed text-custom-text-200": disabled,
                "cursor-pointer hover:bg-custom-background-80": !disabled,
              },
              buttonClassName
            )}
          >
            {label}
            {!noChevron && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
          </Select.Trigger>
        )}
      </>

      <Select.Portal>
        <Select.Backdrop />
        <Select.Positioner align="start">
          <Select.ScrollUpArrow />
          <Select.Popup
            className={cn(
              "my-1 overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none min-w-[12rem] whitespace-nowrap",
              {
                "max-h-60": maxHeight === "lg",
                "max-h-48": maxHeight === "md",
                "max-h-36": maxHeight === "rg",
                "max-h-28": maxHeight === "sm",
              },
              optionsClassName
            )}
          >
            {children}
          </Select.Popup>
          <Select.ScrollDownArrow />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

const Option = (props: ICustomSelectItemProps) => {
  const { children, value, className } = props;
  return (
    <Select.Item
      value={value}
      className={cn(
        "outline-none focus:bg-custom-background-80 cursor-pointer select-none truncate rounded px-1 py-1.5 text-custom-text-200 flex items-center justify-between gap-2 hover:bg-custom-background-80",
        className
      )}
    >
      {children}
      <Select.ItemIndicator className={""}>
        <Check className={"size-3.5 text-custom-text-200 flex-shrink-0"} />
      </Select.ItemIndicator>
    </Select.Item>
  );
};

CustomSelect.Option = Option;

export { CustomSelect };
