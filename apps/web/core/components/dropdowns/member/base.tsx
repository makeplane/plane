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
import { ButtonAvatars } from "./avatar";
import { MemberOptions } from "./member-options";
import type { MemberDropdownProps } from "./types";

type TMemberDropdownBaseProps = {
  getUserDetails: (userId: string) => IUserLite | undefined;
  icon?: LucideIcon;
  memberIds?: string[];
  onClose?: () => void;
  onDropdownOpen?: () => void;
  optionsClassName?: string;
  renderByDefault?: boolean;
} & MemberDropdownProps;

export const MemberDropdownBase = observer(function MemberDropdownBase(props: TMemberDropdownBaseProps) {
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
    getUserDetails,
    hideIcon = false,
    icon,
    memberIds,
    multiple,
    onChange,
    onClose,
    onDropdownOpen,
    optionsClassName = "",
    placeholder = t("members"),
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
    multiple,
  };

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    onClose,
    setIsOpen,
  });

  const dropdownOnChange = (val: string & string[]) => {
    onChange(val);
    if (!multiple) handleClose();
  };

  const getDisplayName = (value: string | string[] | null, showUserDetails: boolean, placeholder: string = "") => {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        if (value.length === 1) {
          return getUserDetails(value[0])?.display_name || placeholder;
        } else {
          return showUserDetails ? `${value.length} ${t("members").toLocaleLowerCase()}` : "";
        }
      } else {
        return placeholder;
      }
    } else {
      if (showUserDetails && value) {
        return getUserDetails(value)?.display_name || placeholder;
      } else {
        return placeholder;
      }
    }
  };

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
            tooltipContent={
              tooltipContent ?? `${value?.length ?? 0} ${value?.length !== 1 ? t("assignees") : t("assignee")}`
            }
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {!hideIcon && <ButtonAvatars showTooltip={showTooltip} userIds={value} icon={icon} />}
            {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
              <span className="flex-grow truncate leading-5 text-left text-body-xs-medium">
                {getDisplayName(value, showUserDetails, placeholder)}
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
        <MemberOptions
          getUserDetails={getUserDetails}
          isOpen={isOpen}
          memberIds={memberIds}
          onDropdownOpen={onDropdownOpen}
          optionsClassName={optionsClassName}
          placement={placement}
          referenceElement={referenceElement}
        />
      )}
    </ComboDropDown>
  );
});
