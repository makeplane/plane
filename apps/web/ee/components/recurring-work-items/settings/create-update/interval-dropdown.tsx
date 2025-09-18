"use client";

import { Fragment, useRef, useState } from "react";
import { usePopper } from "react-popper";
import { Check, ChevronDown } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { ERecurringWorkItemIntervalType } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
// plane web imports
import { COMMON_ERROR_CLASS_NAME } from "@/plane-web/components/recurring-work-items/settings/common/helpers";

const INTERVAL_OPTIONS: { value: ERecurringWorkItemIntervalType; label: string }[] = [
  { value: ERecurringWorkItemIntervalType.DAILY, label: "daily" },
  { value: ERecurringWorkItemIntervalType.WEEKLY, label: "weekly" },
  { value: ERecurringWorkItemIntervalType.MONTHLY, label: "monthly" },
  { value: ERecurringWorkItemIntervalType.YEARLY, label: "yearly" },
];

type TIntervalDropdownProps = {
  value?: ERecurringWorkItemIntervalType | null;
  onChange: (intervalType: ERecurringWorkItemIntervalType | null) => void;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
};

export const IntervalDropdown: React.FC<TIntervalDropdownProps> = (props) => {
  const { value, onChange, className = "", disabled = false, hasError = false } = props;
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // states
  const [isOpen, setIsOpen] = useState(false);

  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  // Find current option
  const currentOption = INTERVAL_OPTIONS.find((option) => option.value === value);

  const dropdownOnChange = (val: ERecurringWorkItemIntervalType | null) => {
    onChange(val);
    handleClose();
  };

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    setIsOpen,
  });

  return (
    <div className={cn("flex items-center gap-2 h-full", className)}>
      <span className="text-custom-text-300 text-sm whitespace-nowrap">repeats</span>
      <Combobox
        as="div"
        ref={dropdownRef}
        className="h-full"
        value={value}
        onChange={dropdownOnChange}
        disabled={disabled}
        onKeyDown={handleKeyDown}
      >
        <Combobox.Button as={Fragment}>
          <button
            ref={setReferenceElement}
            type="button"
            className={cn("clickable block h-full outline-none", {
              "cursor-not-allowed text-custom-text-200": disabled,
              "cursor-pointer": !disabled,
            })}
            onClick={handleOnClick}
          >
            <div
              className={cn(
                "h-full flex items-center justify-between gap-1.5 border-[0.5px] rounded text-xs px-2 py-0.5 hover:bg-custom-background-80 border-custom-border-300 w-fit",
                {
                  [COMMON_ERROR_CLASS_NAME]: hasError,
                }
              )}
            >
              <span className="flex-grow truncate">{currentOption?.label || "Select interval"}</span>
              {!disabled && <ChevronDown className="size-2.5 flex-shrink-0" aria-hidden="true" />}
            </div>
          </button>
        </Combobox.Button>
        {isOpen && (
          <Combobox.Options className="fixed z-10" static>
            <div
              className="my-1 w-24 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              <div className="max-h-48 space-y-1 overflow-y-scroll">
                {INTERVAL_OPTIONS.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${
                        active ? "bg-custom-background-80" : ""
                      } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex-grow truncate">{option.label}</span>
                        {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </div>
            </div>
          </Combobox.Options>
        )}
      </Combobox>
    </div>
  );
};
