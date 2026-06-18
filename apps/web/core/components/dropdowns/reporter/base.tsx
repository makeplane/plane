import { useRef, useState } from "react";
import { observer } from "mobx-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
// plane imports
import type { IUserLite } from "@plane/types";
import { ComboDropDown } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
// local imports
import { DropdownButton } from "../buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "../constants";
import { ButtonAvatars } from "../member/avatar";
import { ReporterOptions } from "./reporter-options";
import type { ReporterDropdownProps } from "./types";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";

type TReporterDropdownBaseProps = {
  getUserDetails: (userId: string) => IUserLite | undefined;
  icon?: LucideIcon;
  memberIds?: string[];
  onClose?: () => void;
  onDropdownOpen?: () => void;
  optionsClassName?: string;
  renderByDefault?: boolean;
} & ReporterDropdownProps;

export const ReporterDropdownBase = observer(function ReporterDropdownBase(props: TReporterDropdownBaseProps) {
  const { t } = useTranslation();
  const {
    button,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant = "border-with-text",
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    getUserDetails,
    hideIcon = false,
    icon,
    memberIds,
    multiple,
    onChange,
    onClose,
    onDropdownOpen,
    optionsClassName = "",
    placeholder = "Reporter",
    placement,
    renderByDefault = true,
    showTooltip = false,
    showUserDetails = false,
    tabIndex,
    tooltipContent,
    value,
  } = props;
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  // states
  const [isOpen, setIsOpen] = useState(false);

  const comboboxProps = {
    value,
    onChange,
    disabled,
    multiple: false,
  };

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    onClose,
    setIsOpen,
  });

  const dropdownOnChange = (val: string) => {
    // Basic validation for free-text emails
    if (val && val.includes("@")) {
      if (!val.endsWith("@winjit.com")) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Reporter email must use the @winjit.com domain.",
        });
        return;
      }
    }
    onChange(val);
    handleClose();
  };

  const getDisplayName = (val: string | null, placeholderText: string = "") => {
    if (!val) return placeholderText;
    
    // Check if it's an email (or local part) instead of a UUID
    if (val.includes("@") || val.includes(".")) {
       return val;
    }
    
    const userDetails = getUserDetails(val);
    return userDetails?.display_name || placeholderText;
  };

  const isEmailValue = value && (value.includes("@") || value.includes("."));

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
          <DropdownButton
            className={cn("text-11", buttonClassName)}
            isActive={isOpen}
            tooltipHeading={placeholder}
            tooltipContent={tooltipContent ?? "Reporter"}
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {!hideIcon && (
              isEmailValue ? (
                <div className="h-5 w-5 rounded-full bg-orange-400/20 text-orange-600 flex items-center justify-center font-medium text-xs ring-2 ring-orange-400/60 ring-offset-1">
                  {value.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="ring-2 ring-orange-400/60 ring-offset-1 rounded-full">
                  <ButtonAvatars showTooltip={showTooltip} userIds={value ? [value] : []} icon={icon} />
                </div>
              )
            )}
            {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
              <span className="flex-grow truncate text-left text-body-xs-medium leading-5">
                {getDisplayName(value, placeholder)}
              </span>
            )}
            {dropdownArrow && (
              <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
            )}
          </DropdownButton>
        </button>
      )}
    </>
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      {...comboboxProps}
      className={cn("h-full", className)}
      onChange={dropdownOnChange}
      onKeyDown={handleKeyDown}
      button={comboButton}
      renderByDefault={renderByDefault}
    >
      {isOpen && (
        <ReporterOptions
          getUserDetails={getUserDetails}
          isOpen={isOpen}
          memberIds={memberIds}
          onDropdownOpen={onDropdownOpen}
          optionsClassName={optionsClassName}
          placement={placement}
          referenceElement={referenceElement}
          value={value}
        />
      )}
    </ComboDropDown>
  );
});
