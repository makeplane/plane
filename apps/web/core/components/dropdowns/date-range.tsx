import React, { useEffect, useRef, useState } from "react";
import type { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
// ui
import type { DateRange, Matcher } from "@plane/propel/calendar";
import { Calendar } from "@plane/propel/calendar";
import { CloseIcon, DueDatePropertyIcon } from "@plane/propel/icons";
import { ComboDropDown } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
// helpers
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { useDropdown } from "@/hooks/use-dropdown";
// components
import { DropdownButton } from "./buttons";
import { MergedDateDisplay } from "./merged-date";
// types
import type { TButtonVariants } from "./types";

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
  clearIconClassName?: string;
  disabled?: boolean;
  hideIcon?: {
    from?: boolean;
    to?: boolean;
  };
  isClearable?: boolean;
  mergeDates?: boolean;
  minDate?: Date;
  maxDate?: Date;
  onSelect?: (range: DateRange | undefined) => void;
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
  customTooltipContent?: React.ReactNode;
  customTooltipHeading?: string;
  defaultOpen?: boolean;
  renderInPortal?: boolean;
};

export const DateRangeDropdown = observer(function DateRangeDropdown(props: Props) {
  const { t } = useTranslation();
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonFromDateClassName,
    buttonToDateClassName,
    buttonVariant,
    className,
    clearIconClassName = "",
    disabled = false,
    hideIcon = {
      from: true,
      to: true,
    },
    isClearable = false,
    mergeDates,
    minDate,
    maxDate,
    onSelect,
    placeholder = {
      from: t("project_cycles.add_date"),
      to: t("project_cycles.add_date"),
    },
    placement,
    showTooltip = false,
    tabIndex,
    value,
    renderByDefault = true,
    renderPlaceholder = true,
    customTooltipContent,
    customTooltipHeading,
    defaultOpen = false,
    renderInPortal = false,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [dateRange, setDateRange] = useState<DateRange>(value);
  // hooks
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;
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

  const disabledDays: Matcher[] = [];
  if (minDate) disabledDays.push({ before: minDate });
  if (maxDate) disabledDays.push({ after: maxDate });

  const clearDates = () => {
    const clearedRange = { from: undefined, to: undefined };
    setDateRange(clearedRange);
    onSelect?.(clearedRange);
  };

  const hasDisplayedDates = dateRange.from || dateRange.to;

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
          "cursor-not-allowed text-secondary": disabled,
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
        tooltipHeading={customTooltipHeading ?? t("project_cycles.date_range")}
        tooltipContent={
          <>
            {customTooltipContent ?? (
              <>
                {dateRange.from ? renderFormattedDate(dateRange.from) : ""}
                {dateRange.from && dateRange.to ? " - " : ""}
                {dateRange.to ? renderFormattedDate(dateRange.to) : ""}
              </>
            )}
          </>
        }
        showTooltip={showTooltip}
        variant={buttonVariant}
        renderToolTipByDefault={renderByDefault}
      >
        {mergeDates ? (
          // Merged date display
          <div className="flex items-center gap-1.5 w-full">
            {!hideIcon.from && <CalendarDays className="h-3 w-3 flex-shrink-0" />}
            {dateRange.from || dateRange.to ? (
              <MergedDateDisplay
                startDate={dateRange.from}
                endDate={dateRange.to}
                className="flex-grow truncate text-11"
              />
            ) : (
              renderPlaceholder && (
                <>
                  <span className="text-placeholder">{placeholder.from}</span>
                  {placeholder.from && placeholder.to && (
                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-placeholder" />
                  )}
                  <span className="text-placeholder">{placeholder.to}</span>
                </>
              )
            )}
            {isClearable && !disabled && hasDisplayedDates && (
              <CloseIcon
                className={cn("h-2.5 w-2.5 flex-shrink-0 cursor-pointer", clearIconClassName)}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  clearDates();
                }}
              />
            )}
          </div>
        ) : (
          // Original separate date display
          <>
            <span
              className={cn(
                "h-full flex items-center justify-center gap-1 rounded-xs flex-grow",
                buttonFromDateClassName
              )}
            >
              {!hideIcon.from && <CalendarDays className="h-3 w-3 flex-shrink-0" />}
              {dateRange.from ? renderFormattedDate(dateRange.from) : renderPlaceholder ? placeholder.from : ""}
            </span>
            <ArrowRight className="h-3 w-3 flex-shrink-0" />
            <span
              className={cn(
                "h-full flex items-center justify-center gap-1 rounded-xs flex-grow",
                buttonToDateClassName
              )}
            >
              {!hideIcon.to && <DueDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
              {dateRange.to ? renderFormattedDate(dateRange.to) : renderPlaceholder ? placeholder.to : ""}
            </span>
            {isClearable && !disabled && hasDisplayedDates && (
              <CloseIcon
                className={cn("h-2.5 w-2.5 flex-shrink-0 cursor-pointer ml-1", clearIconClassName)}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  clearDates();
                }}
              />
            )}
          </>
        )}
      </DropdownButton>
    </button>
  );

  const comboOptions = (
    <Combobox.Options data-prevent-outside-click static>
      <div
        className="my-1 bg-surface-1 border-[0.5px] border-subtle-1 rounded-md overflow-hidden z-30"
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        <Calendar
          className="rounded-md border border-subtle p-3 text-12"
          captionLayout="dropdown"
          selected={dateRange}
          onSelect={(val: DateRange | undefined) => {
            onSelect?.(val);
          }}
          mode="range"
          disabled={disabledDays}
          showOutsideDays
          fixedWeeks
          weekStartsOn={startOfWeek}
          initialFocus
        />
      </div>
    </Combobox.Options>
  );

  const Options = renderInPortal ? createPortal(comboOptions, document.body) : comboOptions;

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
      {isOpen && Options}
    </ComboDropDown>
  );
});
