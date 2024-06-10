"use client";

import { Fragment, ReactNode, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Search, SignalHigh } from "lucide-react";
import { Combobox } from "@headlessui/react";
// types
import { TIssuePriorities } from "@plane/types";
// ui
import { PriorityIcon, Tooltip } from "@plane/ui";
// constants
import { ISSUE_PRIORITIES } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
import { usePlatformOS } from "@/hooks/use-platform-os";
// constants
import { BACKGROUND_BUTTON_VARIANTS, BORDER_BUTTON_VARIANTS, BUTTON_VARIANTS_WITHOUT_TEXT } from "./constants";
// types
import { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  highlightUrgent?: boolean;
  onChange: (val: TIssuePriorities) => void;
  onClose?: () => void;
  value: TIssuePriorities | undefined | null;
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
  priority: TIssuePriorities | undefined;
  showTooltip: boolean;
};

const BorderButton = (props: ButtonProps) => {
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

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  const priorityClasses = {
    urgent: "bg-red-500/20 text-red-950 border-red-500",
    high: "bg-orange-500/20 text-orange-950 border-orange-500",
    medium: "bg-yellow-500/20 text-yellow-950 border-yellow-500",
    low: "bg-custom-primary-100/20 text-custom-primary-950 border-custom-primary-100",
    none: "hover:bg-custom-background-80 border-custom-border-300",
  };

  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading="Priority"
      tooltipContent={priorityDetails?.title ?? "None"}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] rounded text-xs px-2 py-0.5",
          priorityClasses[priority ?? "none"],
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "bg-red-600 border-red-600": priority === "urgent" && hideText && highlightUrgent,
          },
          className
        )}
      >
        {!hideIcon &&
          (priority ? (
            <div
              className={cn({
                // highlight just the icon if text is visible and priority is urgent
                "bg-red-600 p-1 rounded": priority === "urgent" && !hideText && highlightUrgent,
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
                  "text-white": priority === "urgent" && highlightUrgent,
                })}
              />
            </div>
          ) : (
            <SignalHigh className="size-3" />
          ))}
        {!hideText && <span className="flex-grow truncate">{priorityDetails?.title ?? placeholder}</span>}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
};

const BackgroundButton = (props: ButtonProps) => {
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

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  const priorityClasses = {
    urgent: "bg-red-500/20 text-red-950",
    high: "bg-orange-500/20 text-orange-950",
    medium: "bg-yellow-500/20 text-yellow-950",
    low: "bg-blue-500/20 text-blue-950",
    none: "bg-custom-background-80",
  };

  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading="Priority"
      tooltipContent={priorityDetails?.title ?? "None"}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5",
          priorityClasses[priority ?? "none"],
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "bg-red-600 border-red-600": priority === "urgent" && hideText && highlightUrgent,
          },
          className
        )}
      >
        {!hideIcon &&
          (priority ? (
            <div
              className={cn({
                // highlight just the icon if text is visible and priority is urgent
                "bg-red-600 p-1 rounded": priority === "urgent" && !hideText && highlightUrgent,
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
                  "text-white": priority === "urgent" && highlightUrgent,
                })}
              />
            </div>
          ) : (
            <SignalHigh className="size-3" />
          ))}
        {!hideText && <span className="flex-grow truncate">{priorityDetails?.title ?? placeholder}</span>}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
};

const TransparentButton = (props: ButtonProps) => {
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

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  const priorityClasses = {
    urgent: "text-red-950",
    high: "text-orange-950",
    medium: "text-yellow-950",
    low: "text-blue-950",
    none: "hover:text-custom-text-300",
  };

  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading="Priority"
      tooltipContent={priorityDetails?.title ?? "None"}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 hover:bg-custom-background-80",
          priorityClasses[priority ?? "none"],
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "bg-red-600 border-red-600": priority === "urgent" && hideText && highlightUrgent,
            "bg-custom-background-80": isActive,
          },
          className
        )}
      >
        {!hideIcon &&
          (priority ? (
            <div
              className={cn({
                // highlight just the icon if text is visible and priority is urgent
                "bg-red-600 p-1 rounded": priority === "urgent" && !hideText && highlightUrgent,
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
                  "text-white": priority === "urgent" && highlightUrgent,
                })}
              />
            </div>
          ) : (
            <SignalHigh className="size-3" />
          ))}
        {!hideText && <span className="flex-grow truncate">{priorityDetails?.title ?? placeholder}</span>}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
};

export const PriorityDropdown: React.FC<Props> = (props) => {
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
    value = "none",
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

  const options = ISSUE_PRIORITIES.map((priority) => ({
    value: priority.key,
    query: priority.key,
    content: (
      <div className="flex items-center gap-2">
        <PriorityIcon priority={priority.key} size={14} withContainer />
        <span className="flex-grow truncate">{priority.title}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const dropdownOnChange = (val: TIssuePriorities) => {
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
          "bg-custom-background-80": isOpen,
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
                "cursor-not-allowed text-custom-text-200": disabled,
                "cursor-pointer": !disabled,
              },
              buttonContainerClassName
            )}
            onClick={handleOnClick}
          >
            <ButtonToRender
              priority={value ?? undefined}
              className={cn(buttonClassName, {
                "text-custom-text-200": resolvedTheme?.includes("dark") || resolvedTheme === "custom",
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
            className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
              <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
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
                      `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${
                        active ? "bg-custom-background-80" : ""
                      } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex-grow truncate">{option.content}</span>
                        {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">No matching results</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
};
