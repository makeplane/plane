import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, LucideIcon } from "lucide-react";
// ui
import { ComboDropDown } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember } from "@/hooks/store";
import { useDropdown } from "@/hooks/use-dropdown";
// components
import { DropdownButton } from "../buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "../constants";
import { ButtonAvatars } from "./avatar";
// constants
import { MemberOptions } from "./member-options";
// types
import { MemberDropdownProps } from "./types";

type Props = {
  projectId?: string;
  icon?: LucideIcon;
  onClose?: () => void;
  renderByDefault?: boolean;
  optionsClassName?: string;
} & MemberDropdownProps;

export const MemberDropdown: React.FC<Props> = observer((props) => {
  const {
    button,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    optionsClassName = "",
    hideIcon = false,
    multiple,
    onChange,
    onClose,
    placeholder = "Members",
    tooltipContent,
    placement,
    projectId,
    showTooltip = false,
    showUserDetails = false,
    tabIndex,
    value,
    icon,
    renderByDefault = true,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  const { getUserDetails } = useMember();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comboboxProps: any = {
    value,
    onChange,
    disabled,
  };
  if (multiple) comboboxProps.multiple = true;

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
          return showUserDetails ? `${value.length} members` : "";
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
          disabled={disabled}
        >
          <DropdownButton
            className={cn("text-xs", buttonClassName)}
            isActive={isOpen}
            tooltipHeading={placeholder}
            tooltipContent={tooltipContent ?? `${value?.length ?? 0} assignee${value?.length !== 1 ? "s" : ""}`}
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {!hideIcon && <ButtonAvatars showTooltip={showTooltip} userIds={value} icon={icon} />}
            {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
              <span className="flex-grow truncate leading-5">
                {getDisplayName(value, showUserDetails, placeholder)}
              </span>
            )}
            {dropdownArrow && (
              <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
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
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      onChange={dropdownOnChange}
      onKeyDown={handleKeyDown}
      button={comboButton}
      renderByDefault={renderByDefault}
      {...comboboxProps}
    >
      {isOpen && (
        <MemberOptions
          optionsClassName={optionsClassName}
          isOpen={isOpen}
          projectId={projectId}
          placement={placement}
          referenceElement={referenceElement}
        />
      )}
    </ComboDropDown>
  );
});
