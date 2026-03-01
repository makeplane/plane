/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Fragment, useRef, useState, useMemo } from "react";
import { usePopper } from "react-popper";

import { CheckIcon, ChevronDownIcon } from "@plane/propel/icons";
import { Combobox } from "@headlessui/react";
// plane imports
import { Button } from "@plane/propel/button";
import { ERecurringWorkItemIntervalType } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
// plane web imports
import { COMMON_ERROR_CLASS_NAME } from "@/components/recurring-work-items/settings/common/helpers";

// Custom option identifier
const CUSTOM_OPTION = "custom" as const;

type TIntervalOption = ERecurringWorkItemIntervalType | typeof CUSTOM_OPTION;

const INTERVAL_OPTIONS: { value: TIntervalOption; label: string }[] = [
  { value: ERecurringWorkItemIntervalType.DAILY, label: "Daily" },
  { value: ERecurringWorkItemIntervalType.WEEKLY, label: "Weekly" },
  { value: ERecurringWorkItemIntervalType.MONTHLY, label: "Monthly" },
  { value: ERecurringWorkItemIntervalType.YEARLY, label: "Yearly" },
  { value: CUSTOM_OPTION, label: "Custom" },
];

const INTERVAL_TYPE_OPTIONS: { value: ERecurringWorkItemIntervalType; singular: string; plural: string }[] = [
  { value: ERecurringWorkItemIntervalType.DAILY, singular: "day", plural: "days" },
  { value: ERecurringWorkItemIntervalType.WEEKLY, singular: "week", plural: "weeks" },
  { value: ERecurringWorkItemIntervalType.MONTHLY, singular: "month", plural: "months" },
  { value: ERecurringWorkItemIntervalType.YEARLY, singular: "year", plural: "years" },
];

const INTERVAL_COUNT_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

type TIntervalDropdownProps = {
  intervalType?: ERecurringWorkItemIntervalType | null;
  intervalCount?: number;
  onIntervalTypeChange: (intervalType: ERecurringWorkItemIntervalType | null) => void;
  onIntervalCountChange: (intervalCount: number) => void;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
};

export function IntervalDropdown(props: TIntervalDropdownProps) {
  const {
    intervalType,
    intervalCount = 1,
    onIntervalTypeChange,
    onIntervalCountChange,
    className = "",
    disabled = false,
    hasError = false,
  } = props;

  // Determine if custom mode is active (interval_count > 1 means custom)
  const isCustomMode = intervalCount > 1;

  // The selected option in the main dropdown
  const selectedOption: TIntervalOption | null = useMemo(() => {
    if (!intervalType) return null;
    if (isCustomMode) return CUSTOM_OPTION;
    return intervalType;
  }, [intervalType, isCustomMode]);

  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const countDropdownRef = useRef<HTMLDivElement | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);

  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [countReferenceElement, setCountReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [countPopperElement, setCountPopperElement] = useState<HTMLDivElement | null>(null);
  const [typeReferenceElement, setTypeReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [typePopperElement, setTypePopperElement] = useState<HTMLDivElement | null>(null);

  // states
  const [isOpen, setIsOpen] = useState(false);
  const [isCountOpen, setIsCountOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const { styles: countStyles, attributes: countAttributes } = usePopper(countReferenceElement, countPopperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const { styles: typeStyles, attributes: typeAttributes } = usePopper(typeReferenceElement, typePopperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  // Find current option label for non-custom mode
  const currentMainLabel = useMemo(() => {
    if (!intervalType) return "Select";
    if (isCustomMode) return "Custom";
    return INTERVAL_OPTIONS.find((opt) => opt.value === intervalType)?.label || "Select";
  }, [intervalType, isCustomMode]);

  const handleMainDropdownChange = (val: TIntervalOption | null) => {
    if (val === CUSTOM_OPTION) {
      // Switch to custom mode - set interval_count to 2 and keep/set interval_type
      onIntervalCountChange(2);
      if (!intervalType) {
        onIntervalTypeChange(ERecurringWorkItemIntervalType.WEEKLY);
      }
    } else if (val) {
      // Standard option selected - set interval_count to 1
      onIntervalCountChange(1);
      onIntervalTypeChange(val);
    }
    handleClose();
  };

  const handleCountChange = (count: number) => {
    onIntervalCountChange(count);
    handleCountClose();
  };

  const handleTypeChange = (type: ERecurringWorkItemIntervalType) => {
    onIntervalTypeChange(type);
    handleTypeClose();
  };

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    setIsOpen,
  });

  const {
    handleClose: handleCountClose,
    handleKeyDown: handleCountKeyDown,
    handleOnClick: handleCountOnClick,
  } = useDropdown({
    dropdownRef: countDropdownRef,
    isOpen: isCountOpen,
    setIsOpen: setIsCountOpen,
  });

  const {
    handleClose: handleTypeClose,
    handleKeyDown: handleTypeKeyDown,
    handleOnClick: handleTypeOnClick,
  } = useDropdown({
    dropdownRef: typeDropdownRef,
    isOpen: isTypeOpen,
    setIsOpen: setIsTypeOpen,
  });

  const currentTypeOption = INTERVAL_TYPE_OPTIONS.find((opt) => opt.value === intervalType);

  return (
    <div className={cn("flex items-center gap-2 h-full flex-wrap", className)}>
      <span className="text-tertiary text-body-xs-regular whitespace-nowrap">repeats</span>

      {/* Main interval dropdown */}
      <Combobox
        as="div"
        ref={dropdownRef}
        className="h-full"
        value={selectedOption}
        onChange={handleMainDropdownChange}
        disabled={disabled}
        onKeyDown={handleKeyDown}
      >
        <Combobox.Button as={Fragment}>
          <Button
            ref={setReferenceElement}
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleOnClick}
            className={cn("h-7 w-full flex items-center justify-start gap-1.5 border-[0.5px] border-strong", {
              [COMMON_ERROR_CLASS_NAME]: hasError,
            })}
            disabled={disabled}
          >
            <span className="truncate">{currentMainLabel}</span>
            {!disabled && <ChevronDownIcon className="size-2.5 flex-shrink-0" aria-hidden="true" />}
          </Button>
        </Combobox.Button>
        {isOpen && (
          <Combobox.Options className="fixed z-10" static>
            <div
              className="my-1 w-28 rounded-sm border border-subtle bg-surface-1 px-2 py-2.5 text-caption-sm-medium shadow-raised-200 focus:outline-none"
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
                      `w-full truncate flex items-center justify-between gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none ${
                        active ? "bg-layer-1" : ""
                      } ${selected ? "text-primary" : "text-secondary"}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex-grow truncate">{option.label}</span>
                        {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </div>
            </div>
          </Combobox.Options>
        )}
      </Combobox>

      {/* Custom interval configuration - shown inline when custom mode is active */}
      {isCustomMode && (
        <>
          <span className="text-tertiary text-body-xs-regular whitespace-nowrap">every</span>

          {/* Interval count dropdown */}
          <Combobox
            as="div"
            ref={countDropdownRef}
            className="h-full"
            value={intervalCount}
            onChange={handleCountChange}
            disabled={disabled}
            onKeyDown={handleCountKeyDown}
          >
            <Combobox.Button as={Fragment}>
              <Button
                ref={setCountReferenceElement}
                type="button"
                variant="ghost"
                size="lg"
                className={cn(
                  "h-7 w-full flex items-center justify-start gap-1.5 border-[0.5px] border-strong",
                  { [COMMON_ERROR_CLASS_NAME]: hasError },
                  className
                )}
                onClick={handleCountOnClick}
                disabled={disabled}
              >
                <span className="flex-grow text-center">{intervalCount}</span>
                {!disabled && <ChevronDownIcon className="size-2.5 flex-shrink-0" aria-hidden="true" />}
              </Button>
            </Combobox.Button>
            {isCountOpen && (
              <Combobox.Options className="fixed z-10" static>
                <div
                  className="my-1 w-16 rounded-sm border border-subtle bg-surface-1 px-2 py-2.5 text-caption-sm-medium shadow-raised-200 focus:outline-none"
                  ref={setCountPopperElement}
                  style={countStyles.popper}
                  {...countAttributes.popper}
                >
                  <div className="max-h-48 space-y-1 overflow-y-scroll">
                    {INTERVAL_COUNT_OPTIONS.map((count) => (
                      <Combobox.Option
                        key={count}
                        value={count}
                        className={({ active, selected }) =>
                          `w-full truncate flex items-center justify-center gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none ${
                            active ? "bg-layer-1" : ""
                          } ${selected ? "text-primary" : "text-secondary"}`
                        }
                      >
                        {count}
                      </Combobox.Option>
                    ))}
                  </div>
                </div>
              </Combobox.Options>
            )}
          </Combobox>

          {/* Interval type dropdown */}
          <Combobox
            as="div"
            ref={typeDropdownRef}
            className="h-full"
            value={intervalType}
            onChange={handleTypeChange}
            disabled={disabled}
            onKeyDown={handleTypeKeyDown}
          >
            <Combobox.Button as={Fragment}>
              <Button
                ref={setTypeReferenceElement}
                type="button"
                variant="ghost"
                size="lg"
                className={cn(
                  "h-7 w-full flex items-center justify-start gap-1.5 border-[0.5px] border-strong",
                  { [COMMON_ERROR_CLASS_NAME]: hasError },
                  className
                )}
                onClick={handleTypeOnClick}
                disabled={disabled}
              >
                <span className="truncate">
                  {currentTypeOption
                    ? intervalCount === 1
                      ? currentTypeOption.singular
                      : currentTypeOption.plural
                    : "Select"}
                </span>
                {!disabled && <ChevronDownIcon className="size-2.5 flex-shrink-0" aria-hidden="true" />}
              </Button>
            </Combobox.Button>
            {isTypeOpen && (
              <Combobox.Options className="fixed z-10" static>
                <div
                  className="my-1 w-24 rounded-sm border border-subtle bg-surface-1 px-2 py-2.5 text-caption-sm-medium shadow-raised-200 focus:outline-none"
                  ref={setTypePopperElement}
                  style={typeStyles.popper}
                  {...typeAttributes.popper}
                >
                  <div className="max-h-48 space-y-1 overflow-y-scroll">
                    {INTERVAL_TYPE_OPTIONS.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active, selected }) =>
                          `w-full truncate flex items-center justify-between gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none ${
                            active ? "bg-layer-1" : ""
                          } ${selected ? "text-primary" : "text-secondary"}`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className="flex-grow truncate">
                              {intervalCount === 1 ? option.singular : option.plural}
                            </span>
                            {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </div>
                </div>
              </Combobox.Options>
            )}
          </Combobox>
        </>
      )}
    </div>
  );
}
