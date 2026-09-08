/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { DayPicker, UI } from "react-day-picker";
import type { DropdownProps } from "react-day-picker";
import { ChevronDownIcon } from "../icons/arrows/chevron-down";
import { ChevronLeftIcon } from "../icons/arrows/chevron-left";

import { cn } from "../utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Replacement for react-day-picker's caption dropdowns (month/year).
 *
 * The default implementation renders an invisible native `<select>` over the caption label.
 * Inside Plane's portaled dropdown popups, clicking that native select opens an OS-level
 * popup window: the browser window blurs and the surrounding Headless UI combobox treats it
 * as an outside interaction, tearing down the calendar before the selection lands. Rendering
 * an in-page menu instead (portal-positioned, so it is not clipped by the popup's
 * `overflow-hidden`) keeps the interaction inside the window and avoids the blur entirely.
 */
function CalendarCaptionDropdown(dropdownProps: DropdownProps) {
  const { options, value, onChange, disabled, className, classNames, "aria-label": ariaLabel, style } = dropdownProps;
  const [isOpen, setIsOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number; openUpwards: boolean } | null>(
    null
  );
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options?.find((option) => option.value === Number(value));

  const handleTriggerClick = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // flip the menu above the trigger when there is not enough room below
    const openUpwards = rect.bottom + 260 > window.innerHeight && rect.top > 260;
    setMenuPosition({ top: openUpwards ? rect.top - 4 : rect.bottom + 4, left: rect.left, openUpwards });
    setIsOpen(true);
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    // the menu is anchored to viewport coordinates: any viewport change closes it,
    // except scrolls inside the menu itself (wheel-scrolling the option list)
    const handleViewportChange = (event: Event) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  const handleOptionSelect = (optionValue: number) => {
    // react-day-picker's month/year change handlers read `e.target.value` from the change event
    onChange?.({ target: { value: String(optionValue) } } as React.ChangeEvent<HTMLSelectElement>);
    setIsOpen(false);
  };

  // bring the selected option into view when the menu opens (e.g. the current year)
  React.useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
  }, [isOpen]);

  return (
    <span data-disabled={disabled === true} className={classNames[UI.DropdownRoot]} style={style}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={handleTriggerClick}
        className={cn(classNames[UI.CaptionLabel], className, "cursor-pointer disabled:cursor-not-allowed")}
      >
        {selectedOption?.label}
        <ChevronDownIcon className="ml-1 size-3.5" />
      </button>
      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            className="fixed z-[9999] min-w-28 overflow-auto rounded-md border border-subtle bg-surface-1 p-1 shadow-raised-200"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              maxHeight: "16rem",
              ...(menuPosition.openUpwards ? { transform: "translateY(-100%)" } : {}),
            }}
          >
            {options?.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === Number(value)}
                disabled={option.disabled}
                onClick={() => handleOptionSelect(option.value)}
                className={cn(
                  "flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-13 outline-none hover:bg-layer-transparent-hover focus-visible:bg-layer-transparent-hover disabled:cursor-not-allowed disabled:opacity-50",
                  { "bg-layer-transparent-active": option.value === Number(value) }
                )}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </span>
  );
}

export function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  const currentYear = new Date().getFullYear();
  const thirtyYearsAgoFirstDay = new Date(currentYear - 30, 0, 1);
  const thirtyYearsFromNowFirstDay = new Date(currentYear + 30, 11, 31);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      weekStartsOn={props.weekStartsOn}
      components={{
        Chevron: ({ className: chevronClassName, ...chevronProps }) => (
          <ChevronLeftIcon
            className={cn(
              "size-4",
              { "rotate-180": chevronProps.orientation === "right", "-rotate-90": chevronProps.orientation === "down" },
              chevronClassName
            )}
            {...chevronProps}
          />
        ),
        Dropdown: CalendarCaptionDropdown,
      }}
      startMonth={thirtyYearsAgoFirstDay}
      endMonth={thirtyYearsFromNowFirstDay}
      {...props}
    />
  );
}
