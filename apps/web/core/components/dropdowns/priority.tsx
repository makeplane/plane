import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { usePopper } from "react-popper";
import { SignalHigh } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// types
import { CheckIcon, PriorityIcon, ChevronDownIcon, SearchIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssuePriorities } from "@plane/types";
// ui
import { ComboDropDown } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
import { usePlatformOS } from "@/hooks/use-platform-os";
// constants
import { BACKGROUND_BUTTON_VARIANTS, BORDER_BUTTON_VARIANTS, BUTTON_VARIANTS_WITHOUT_TEXT } from "./constants";
// types
import type { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  highlightUrgent?: boolean;
  onChange: (val: TIssuePriorities) => void;
  onClose?: () => void;
  value: TIssuePriorities | undefined | null;
  renderByDefault?: boolean;
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
  renderToolTipByDefault?: boolean;
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
    renderToolTipByDefault = true,
  } = props;

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  const priorityClasses = {
    urgent: "bg-layer-2 border-priority-urgent px-1",
    high: "bg-layer-2 border-priority-high",
    medium: "bg-layer-2 border-priority-medium",
    low: "bg-layer-2 border-priority-low",
    none: "bg-layer-2 border-strong",
  };

  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  return (
    <Tooltip
      tooltipHeading={t("priority")}
      tooltipContent={priorityDetails?.title ?? t("common.none")}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] rounded-sm px-2 py-0.5",
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
        {!hideText && (
          <span
            className={cn("flex-grow truncate text-body-xs-medium", {
              "text-secondary": priority && priority !== "none",
              "text-placeholder": !priority || priority === "none",
            })}
          >
            {priorityDetails?.title ?? placeholder}
          </span>
        )}
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
    renderToolTipByDefault = true,
  } = props;

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  const priorityClasses = {
    urgent: "bg-layer-2",
    high: "bg-layer-2",
    medium: "bg-layer-2",
    low: "bg-layer-2",
    none: "bg-layer-2",
  };

  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  return (
    <Tooltip
      tooltipHeading={t("priority")}
      tooltipContent={t(priorityDetails?.key ?? "none")}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded-sm px-2 py-0.5",
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
        {!hideText && (
          <span
            className={cn("flex-grow truncate text-body-xs-medium", {
              "text-secondary": priority && priority !== "none",
              "text-placeholder": !priority || priority === "none",
            })}
          >
            {priorityDetails?.title ?? t("common.priority") ?? placeholder}
          </span>
        )}
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
    renderToolTipByDefault = true,
  } = props;

  const priorityDetails = ISSUE_PRIORITIES.find((p) => p.key === priority);

  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  return (
    <Tooltip
      tooltipHeading={t("priority")}
      tooltipContent={priorityDetails?.title ?? t("common.none")}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full w-full flex items-center gap-1.5 rounded-sm hover:bg-layer-transparent-hover px-2",
          {
            // compact the icons if text is hidden
            "px-0.5": hideText,
            // highlight the whole button if text is hidden and priority is urgent
            "border-priority-urgent": priority === "urgent" && hideText && highlightUrgent,
            "bg-layer-1": isActive,
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
        {!hideText && (
          <span
            className={cn("flex-grow truncate text-body-xs-medium", {
              "text-secondary": priority && priority !== "none",
              "text-placeholder": !priority || priority === "none",
            })}
          >
            {priorityDetails?.title ?? t("common.priority") ?? placeholder}
          </span>
        )}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  );
}

export function PriorityDropdown(props: Props) {
  //hooks
  const { t } = useTranslation();
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
    placeholder = t("common.priority"),
    placement,
    showTooltip = false,
    tabIndex,
    value = "none",
    renderByDefault = true,
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

  const comboButton = (
    <>
      {button ? (
        <button
          ref={setReferenceElement}
          type="button"
          className={cn("clickable block h-full w-full outline-none", buttonContainerClassName)}
          onClick={handleOnClick}
          disabled={disabled}
          tabIndex={tabIndex}
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
          disabled={disabled}
          tabIndex={tabIndex}
        >
          <ButtonToRender
            priority={value ?? undefined}
            className={buttonClassName}
            highlightUrgent={highlightUrgent}
            dropdownArrow={dropdownArrow && !disabled}
            dropdownArrowClassName={dropdownArrowClassName}
            hideIcon={hideIcon}
            placeholder={placeholder}
            showTooltip={showTooltip}
            hideText={BUTTON_VARIANTS_WITHOUT_TEXT.includes(buttonVariant)}
            renderToolTipByDefault={renderByDefault}
          />
        </button>
      )}
    </>
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
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
      button={comboButton}
      renderByDefault={renderByDefault}
    >
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
              <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
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
                      cn(
                        `w-full truncate flex items-center justify-between gap-2 rounded-sm px-1 py-1.5 cursor-pointer select-none ${
                          active ? "bg-layer-transparent-hover" : ""
                        } ${selected ? "text-primary" : "text-secondary"}`
                      )
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
                <p className="text-placeholder italic py-1 px-1.5">{t("no_matching_results")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
}
