"use client";

import React, { useEffect, useRef, useState } from "react";
import { Placement } from "@popperjs/core";
import { DateRange, DayPicker, Matcher, getDefaultClassNames } from "react-day-picker";
import { usePopper } from "react-popper";
import { ArrowRight, CalendarCheck2, CalendarDays } from "lucide-react";
import { Combobox } from "@headlessui/react";
// ui
import { Button, ComboDropDown } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
// components
import { DropdownButton } from "./buttons";
// types
import { TButtonVariants } from "./types";

type Props = {
  applyButtonText?: string;
  bothRequired?: boolean;
  buttonClassName?: string;
  buttonContainerClassName?: string;
  buttonFromDateClassName?: string;
  buttonToDateClassName?: string;
  buttonVariant: TButtonVariants;
  cancelButtonText?: string;
  className?: string;
  disabled?: boolean;
  hideIcon?: {
    from?: boolean;
    to?: boolean;
  };
  minDate?: Date;
  maxDate?: Date;
  onSelect: (range: DateRange | undefined) => void;
  placeholder?: {
    from?: string;
    to?: string;
  };
  placement?: Placement;
  required?: boolean;
  showTooltip?: boolean;
  tabIndex?: number;
  value: {
    from: Date | undefined;
    to: Date | undefined;
  };
  renderByDefault?: boolean;
  renderPlaceholder?: boolean;
};

const defaultClassNames = getDefaultClassNames();

export const DateRangeDropdown: React.FC<Props> = (props) => {
  const {
    applyButtonText = "Apply changes",
    bothRequired = true,
    buttonClassName,
    buttonContainerClassName,
    buttonFromDateClassName,
    buttonToDateClassName,
    buttonVariant,
    cancelButtonText = "Cancel",
    className,
    disabled = false,
    hideIcon = {
      from: true,
      to: true,
    },
    minDate,
    maxDate,
    onSelect,
    placeholder = {
      from: "Add date",
      to: "Add date",
    },
    placement,
    required = false,
    showTooltip = false,
    tabIndex,
    value,
    renderByDefault = true,
    renderPlaceholder = true,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(value);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const onOpen = () => {
    if (referenceElement) referenceElement.focus();
  };

  const { handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    onOpen,
    setIsOpen,
  });

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    setDateRange({
      from: value.from,
      to: value.to,
    });
    if (referenceElement) referenceElement.blur();
  };

  const disabledDays: Matcher[] = [];
  if (minDate) disabledDays.push({ before: minDate });
  if (maxDate) disabledDays.push({ after: maxDate });

  useEffect(() => {
    setDateRange(value);
  }, [value]);

  const comboButton = (
    <button
      ref={setReferenceElement}
      type="button"
      className={cn(
        "clickable block h-full max-w-full outline-none",
        {
          "cursor-not-allowed text-custom-text-200": disabled,
          "cursor-pointer": !disabled,
        },
        buttonContainerClassName
      )}
      onClick={handleOnClick}
      disabled={disabled}
    >
      <DropdownButton
        className={buttonClassName}
        isActive={isOpen}
        tooltipHeading="Date range"
        tooltipContent={
          <>
            {dateRange.from ? renderFormattedDate(dateRange.from) : "N/A"}
            {" - "}
            {dateRange.to ? renderFormattedDate(dateRange.to) : "N/A"}
          </>
        }
        showTooltip={showTooltip}
        variant={buttonVariant}
        renderToolTipByDefault={renderByDefault}
      >
        <span
          className={cn("h-full flex items-center justify-center gap-1 rounded-sm flex-grow", buttonFromDateClassName)}
        >
          {!hideIcon.from && <CalendarDays className="h-3 w-3 flex-shrink-0" />}
          {dateRange.from ? renderFormattedDate(dateRange.from) : renderPlaceholder ? placeholder.from : ""}
        </span>
        <ArrowRight className="h-3 w-3 flex-shrink-0" />
        <span
          className={cn("h-full flex items-center justify-center gap-1 rounded-sm flex-grow", buttonToDateClassName)}
        >
          {!hideIcon.to && <CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
          {dateRange.to ? renderFormattedDate(dateRange.to) : renderPlaceholder ? placeholder.to : ""}
        </span>
      </DropdownButton>
    </button>
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (!isOpen) handleKeyDown(e);
        } else handleKeyDown(e);
      }}
      button={comboButton}
      disabled={disabled}
      renderByDefault={renderByDefault}
    >
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 bg-custom-background-100 shadow-custom-shadow-rg overflow-hidden"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <DayPicker
              captionLayout="dropdown"
              classNames={{ root: `${defaultClassNames.root} p-3 rounded-md` }}
              selected={dateRange}
              onSelect={(val) => {
                // if both the dates are not required, immediately call onSelect
                if (!bothRequired) onSelect(val);
                setDateRange({
                  from: val?.from ?? undefined,
                  to: val?.to ?? undefined,
                });
              }}
              mode="range"
              disabled={disabledDays}
              showOutsideDays
              autoFocus
              fixedWeeks
              footer={
                bothRequired && (
                  <div className="grid grid-cols-2 items-center gap-3.5 pt-6 relative">
                    <div className="absolute left-0 top-1 h-[0.5px] w-full border-t-[0.5px] border-custom-border-300" />
                    <Button
                      variant="neutral-primary"
                      onClick={() => {
                        setDateRange({
                          from: undefined,
                          to: undefined,
                        });
                        handleClose();
                      }}
                    >
                      {cancelButtonText}
                    </Button>
                    <Button
                      onClick={() => {
                        onSelect(dateRange);
                        handleClose();
                      }}
                      // if required, both the dates should be selected
                      // if not required, either both or none of the dates should be selected
                      disabled={required ? !(dateRange.from && dateRange.to) : !!dateRange.from !== !!dateRange.to}
                    >
                      {applyButtonText}
                    </Button>
                  </div>
                )
              }
            />
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
};
