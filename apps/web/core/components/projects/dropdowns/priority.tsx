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

import type { ReactNode } from "react";
import { Fragment, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { usePopper } from "react-popper";
import { Search, SignalHigh } from "lucide-react";
import { CheckIcon } from "@plane/propel/icons";
import { Combobox } from "@headlessui/react";
// plane imports
import { ChevronDownIcon, PriorityIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// constants
// helpers
import { cn } from "@plane/utils";
import {
  BACKGROUND_BUTTON_VARIANTS,
  BORDER_BUTTON_VARIANTS,
  BUTTON_VARIANTS_WITHOUT_TEXT,
} from "@/components/dropdowns/constants";
import type { TDropdownProps } from "@/components/dropdowns/types";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { PROJECT_PRIORITIES } from "@/constants/project";
import type { TProjectPriority } from "@/types/workspace-project-filters";
import { EProjectPriority } from "@/types/workspace-project-states";
// constants
// types

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  highlightUrgent?: boolean;
  onChange: (val: TProjectPriority) => void;
  onClose?: () => void;
  value: TProjectPriority | undefined | null;
};

type ButtonProps = {
  className?: string;
  dropdownArrow: boolean;
  dropdownArrowClassName: string;
  hideIcon?: boolean;
  hideText?: boolean;
  isActive?: boolean;
  highlightUrgent: boolean;
  placeholder: string;
  priority: TProjectPriority | undefined;
  showTooltip: boolean;
};

function BorderButton(props: ButtonProps) {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    highlightUrgent,
    placeholder,
    priority,
    showTooltip,
  } = props;

  const priorityDetails = PROJECT_PRIORITIES.find((p) => p.key === priority);

  const priorityClasses = {
    urgent: "bg-layer-2 border-priority-urgent px-1",
    high: "bg-layer-2 border-priority-high",
    medium: "bg-layer-2 border-priority-medium",
    low: "bg-layer-2 border-priority-low",
    none: "bg-layer-2 border-strong",
  };

  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading="Priority"
      tooltipContent={priorityDetails?.label ?? "None"}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] rounded-sm text-11 px-2 py-0.5",
          priorityClasses[priority ?? "none"],
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "border-priority-urgent": priority === "urgent" && hideText && highlightUrgent,
          },
          className
        )}
      >
        {!hideIcon &&
          (priority ? (
            <div
              className={cn({
                // highlight just the icon if text is visible and priority is urgent
                "p-0.5 rounded-sm border border-priority-urgent": priority === "urgent" && !hideText && highlightUrgent,
              })}
            >
              <PriorityIcon
                priority={priority}
                size={12}
                className={cn("flex-shrink-0", {
                  // increase the icon size if text is hidden
                  "h-3.5 w-3.5": hideText,
                  // centre align the icons if text is hidden
                  "translate-x-[0.0625rem]": hideText && priority === "high",
                  "translate-x-0.5": hideText && priority === "medium",
                  "translate-x-1": hideText && priority === "low",
                  // highlight the icon if priority is urgent
                })}
              />
            </div>
          ) : (
            <SignalHigh className="size-3" />
          ))}
        {!hideText && <span className="flex-grow truncate">{priorityDetails?.label ?? placeholder}</span>}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
}

function BackgroundButton(props: ButtonProps) {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    highlightUrgent,
    placeholder,
    priority,
    showTooltip,
  } = props;

  const priorityDetails = PROJECT_PRIORITIES.find((p) => p.key === priority);

  const priorityClasses = {
    urgent: "bg-layer-2",
    high: "bg-layer-2",
    medium: "bg-layer-2",
    low: "bg-layer-2",
    none: "bg-layer-2",
  };

  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading="Priority"
      tooltipContent={priorityDetails?.label ?? "None"}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded-sm text-11 px-2 py-0.5",
          priorityClasses[priority ?? "none"],
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "border-priority-urgent": priority === "urgent" && hideText && highlightUrgent,
          },
          className
        )}
      >
        {!hideIcon &&
          (priority ? (
            <div
              className={cn({
                // highlight just the icon if text is visible and priority is urgent
                "p-0.5 rounded-sm border border-priority-urgent": priority === "urgent" && !hideText && highlightUrgent,
              })}
            >
              <PriorityIcon
                priority={priority}
                size={12}
                className={cn("flex-shrink-0", {
                  // increase the icon size if text is hidden
                  "h-3.5 w-3.5": hideText,
                  // centre align the icons if text is hidden
                  "translate-x-[0.0625rem]": hideText && priority === "high",
                  "translate-x-0.5": hideText && priority === "medium",
                  "translate-x-1": hideText && priority === "low",
                  // highlight the icon if priority is urgent
                })}
              />
            </div>
          ) : (
            <SignalHigh className="size-3" />
          ))}
        {!hideText && <span className="flex-grow truncate">{priorityDetails?.label ?? placeholder}</span>}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
}

function TransparentButton(props: ButtonProps) {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    isActive = false,
    highlightUrgent,
    placeholder,
    priority,
    showTooltip,
  } = props;

  const priorityDetails = PROJECT_PRIORITIES.find((p) => p.key === priority);

  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading="Priority"
      tooltipContent={priorityDetails?.label ?? "None"}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded-sm text-11 px-2 py-0.5 hover:bg-layer-transparent-hover",
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "border-priority-urgent": priority === "urgent" && hideText && highlightUrgent,
            "bg-layer-transparent-active": isActive,
          },
          className
        )}
      >
        {!hideIcon &&
          (priority ? (
            <div
              className={cn({
                // highlight just the icon if text is visible and priority is urgent
                "p-0.5 rounded-sm border border-priority-urgent": priority === "urgent" && !hideText && highlightUrgent,
              })}
            >
              <PriorityIcon
                priority={priority}
                size={12}
                className={cn("flex-shrink-0", {
                  // increase the icon size if text is hidden
                  "h-3.5 w-3.5": hideText,
                  // centre align the icons if text is hidden
                  "translate-x-px": hideText && priority === "high",
                  "translate-x-0.5": hideText && priority === "medium",
                  "translate-x-1": hideText && priority === "low",
                  // highlight the icon if priority is urgent
                })}
              />
            </div>
          ) : (
            <SignalHigh className="size-3" />
          ))}
        {!hideText && <span className="grow truncate">{priorityDetails?.label ?? placeholder}</span>}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
}

export function PriorityDropdown(props: Props) {
  const {
    button,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    hideIcon = false,
    highlightUrgent = true,
    onChange,
    onClose,
    placeholder = "Priority",
    placement,
    showTooltip = false,
    tabIndex,
    value = EProjectPriority.NONE,
  } = props;
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
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
  // next-themes
  // TODO: remove this after new theming implementation
  const { resolvedTheme } = useTheme();

  const options = PROJECT_PRIORITIES.map((priority) => ({
    value: priority.key,
    query: priority.key,
    content: (
      <div className="flex items-center gap-2">
        <PriorityIcon priority={priority.key} size={14} withContainer />
        <span className="flex-grow truncate">{priority.label}</span>
      </div>
    ),
  })).reverse();

  const filteredOptions =
    query === "" ? options : options.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const dropdownOnChange = (val: TProjectPriority) => {
    onChange(val);
    handleClose();
  };

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    query,
    setIsOpen,
    setQuery,
  });

  const ButtonToRender = BORDER_BUTTON_VARIANTS.includes(buttonVariant)
    ? BorderButton
    : BACKGROUND_BUTTON_VARIANTS.includes(buttonVariant)
      ? BackgroundButton
      : TransparentButton;

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn(
        "h-full",
        {
          "bg-layer-1": isOpen,
        },
        className
      )}
      value={value}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
    >
      <Combobox.Button as={Fragment}>
        {button ? (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn("clickable block h-full w-full outline-none", buttonContainerClassName)}
            onClick={handleOnClick}
          >
            {button}
          </button>
        ) : (
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
          >
            <ButtonToRender
              priority={value ?? undefined}
              className={cn(buttonClassName, {
                "text-secondary": resolvedTheme?.includes("dark") || resolvedTheme === "custom",
              })}
              highlightUrgent={highlightUrgent}
              dropdownArrow={dropdownArrow && !disabled}
              dropdownArrowClassName={dropdownArrowClassName}
              hideIcon={hideIcon}
              placeholder={placeholder}
              showTooltip={showTooltip}
              hideText={BUTTON_VARIANTS_WITHOUT_TEXT.includes(buttonVariant)}
            />
          </button>
        )}
      </Combobox.Button>
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-layer-1 px-2">
              <Search className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
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
                        <span className="flex-grow truncate">{option.content}</span>
                        {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <p className="text-placeholder italic py-1 px-1.5">No matching results</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
}
