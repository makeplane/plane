import { Fragment, ReactNode, useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Search } from "lucide-react";
// hooks
import { useDropdownKeyDown } from "hooks/use-dropdown-key-down";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// icons
import { PriorityIcon, Tooltip } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TIssuePriorities } from "@plane/types";
import { TDropdownProps } from "./types";
// constants
import { ISSUE_PRIORITIES } from "constants/issue";
import { BACKGROUND_BUTTON_VARIANTS, BORDER_BUTTON_VARIANTS, BUTTON_VARIANTS_WITHOUT_TEXT } from "./constants";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  highlightUrgent?: boolean;
  onChange: (val: TIssuePriorities) => void;
  onClose?: () => void;
  value: TIssuePriorities;
};

type ButtonProps = {
  className?: string;
  dropdownArrow: boolean;
  dropdownArrowClassName: string;
  hideIcon?: boolean;
  hideText?: boolean;
  isActive?: boolean;
  highlightUrgent: boolean;
  priority: TIssuePriorities;
  showTooltip: boolean;
};

const PRIORITY_CLASSES = {
  urgent: {
    border: "border-danger-border-strong",
    bg: "bg-danger-component-surface-medium",
    text: "text-danger-text-strong",
  },
  high: {
    border: "border-orange-70",
    bg: "bg-orange-40",
    text: "text-orange-120",
  },
  medium: {
    border: "border-warning-border-strong",
    bg: "bg-warning-page-surface-medium",
    text: "text-warning-text-strong",
  },
  low: {
    border: "border-primary-border-strong",
    bg: "bg-primary-component-surface-light",
    text: "text-primary-text-strong",
  },
  none: {
    border: "border-neutral-border-medium",
    bg: "bg-neutral-component-surface-medium",
    text: "text-neutral-text-strong",
  },
};

const BorderButton = (props: ButtonProps) => {
  const {
    className,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon = false,
    hideText = false,
    highlightUrgent,
    priority,
    showTooltip,
  } = props;

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  return (
    <Tooltip tooltipHeading="Priority" tooltipContent={priorityDetails?.title ?? "None"} disabled={!showTooltip}>
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] rounded text-xs px-2 py-0.5",
          PRIORITY_CLASSES[priority].border,
          PRIORITY_CLASSES[priority].bg,
          PRIORITY_CLASSES[priority].text,
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "bg-danger-solid border-danger-solid": priority === "urgent" && hideText && highlightUrgent,
          },
          className
        )}
      >
        {!hideIcon && (
          <div
            className={cn({
              // highlight just the icon if text is visible and priority is urgent
              "bg-danger-solid p-1 rounded": priority === "urgent" && !hideText && highlightUrgent,
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
        )}
        {!hideText && <span className="flex-grow truncate">{priorityDetails?.title}</span>}
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
    priority,
    showTooltip,
  } = props;

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  return (
    <Tooltip tooltipHeading="Priority" tooltipContent={priorityDetails?.title ?? "None"} disabled={!showTooltip}>
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5",
          PRIORITY_CLASSES[priority].border,
          PRIORITY_CLASSES[priority].text,
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "bg-danger-solid border-danger-solid": priority === "urgent" && hideText && highlightUrgent,
          },
          className
        )}
      >
        {!hideIcon && (
          <div
            className={cn({
              // highlight just the icon if text is visible and priority is urgent
              "bg-danger-solid p-1 rounded": priority === "urgent" && !hideText && highlightUrgent,
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
        )}
        {!hideText && <span className="flex-grow truncate">{priorityDetails?.title}</span>}
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
    priority,
    showTooltip,
  } = props;

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  return (
    <Tooltip tooltipHeading="Priority" tooltipContent={priorityDetails?.title ?? "None"} disabled={!showTooltip}>
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 hover:bg-neutral-component-surface-dark",
          PRIORITY_CLASSES[priority].text,
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "bg-danger-solid border-red-500": priority === "urgent" && hideText && highlightUrgent,
            "bg-neutral-component-surface-dark": isActive,
          },
          className
        )}
      >
        {!hideIcon && (
          <div
            className={cn({
              // highlight just the icon if text is visible and priority is urgent
              "bg-danger-solid p-1 rounded": priority === "urgent" && !hideText && highlightUrgent,
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
        )}
        {!hideText && <span className="flex-grow truncate">{priorityDetails?.title}</span>}
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
    placement,
    showTooltip = false,
    tabIndex,
    value,
  } = props;
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

  const onOpen = () => {
    if (referenceElement) referenceElement.focus();
  };

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    if (referenceElement) referenceElement.blur();
    onClose && onClose();
  };

  const toggleDropdown = () => {
    if (!isOpen) onOpen();
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  const dropdownOnChange = (val: TIssuePriorities) => {
    onChange(val);
    handleClose();
  };

  const handleKeyDown = useDropdownKeyDown(toggleDropdown, handleClose);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleDropdown();
  };

  useOutsideClickDetector(dropdownRef, handleClose);

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
          "bg-neutral-component-surface-dark": isOpen,
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
                "cursor-not-allowed text-neutral-text-medium": disabled,
                "cursor-pointer": !disabled,
              },
              buttonContainerClassName
            )}
            onClick={handleOnClick}
          >
            <ButtonToRender
              priority={value}
              className={buttonClassName}
              highlightUrgent={highlightUrgent}
              dropdownArrow={dropdownArrow && !disabled}
              dropdownArrowClassName={dropdownArrowClassName}
              hideIcon={hideIcon}
              showTooltip={showTooltip}
              hideText={BUTTON_VARIANTS_WITHOUT_TEXT.includes(buttonVariant)}
            />
          </button>
        )}
      </Combobox.Button>
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded border-[0.5px] border-neutral-border-medium bg-neutral-component-surface-light px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded border border-neutral-border-subtle bg-neutral-component-surface-medium px-2">
              <Search className="h-3.5 w-3.5 text-neutral-text-subtle" strokeWidth={1.5} />
              <Combobox.Input
                className="w-full bg-transparent py-1 text-xs text-neutral-text-medium placeholder:text-neutral-text-subtle focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
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
                        active ? "bg-neutral-component-surface-dark" : ""
                      } ${selected ? "text-neutral-text-strong" : "text-neutral-text-medium"}`
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
                <p className="text-neutral-text-subtle italic py-1 px-1.5">No matching results</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
};
