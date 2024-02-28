import { Fragment, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
// hooks
import { useMember } from "hooks/store";
import { useDropdownKeyDown } from "hooks/use-dropdown-key-down";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { ButtonAvatars } from "./avatar";
import { DropdownButton } from "../buttons";
// helpers
import { cn } from "helpers/common.helper";
// types
import { MemberDropdownProps } from "./types";
// constants
import { BUTTON_VARIANTS_WITH_TEXT } from "../constants";
import { MemberOptions } from "./member-options";

type Props = {
  projectId?: string;
  onClose?: () => void;
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
    hideIcon = false,
    multiple,
    onChange,
    onClose,
    placeholder = "Members",
    placement,
    projectId,
    showTooltip = false,
    tabIndex,
    value,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  const { getUserDetails } = useMember();

  const comboboxProps: any = {
    value,
    onChange,
    disabled,
  };
  if (multiple) comboboxProps.multiple = true;

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    onClose && onClose();
  };

  const toggleDropdown = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  const dropdownOnChange = (val: string & string[]) => {
    onChange(val);
    if (!multiple) handleClose();
  };

  const handleKeyDown = useDropdownKeyDown(toggleDropdown, handleClose);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleDropdown();
  };

  useOutsideClickDetector(dropdownRef, handleClose);

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      onChange={dropdownOnChange}
      onKeyDown={handleKeyDown}
      {...comboboxProps}
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
            <DropdownButton
              className={buttonClassName}
              isActive={isOpen}
              tooltipHeading={placeholder}
              tooltipContent={`${value?.length ?? 0} assignee${value?.length !== 1 ? "s" : ""}`}
              showTooltip={showTooltip}
              variant={buttonVariant}
            >
              {!hideIcon && <ButtonAvatars showTooltip={showTooltip} userIds={value} />}
              {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
                <span className="flex-grow truncate text-xs leading-5">
                  {Array.isArray(value) && value.length > 0
                    ? value.length === 1
                      ? getUserDetails(value[0])?.display_name
                      : ""
                    : placeholder}
                </span>
              )}
              {dropdownArrow && (
                <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
              )}
            </DropdownButton>
          </button>
        )}
      </Combobox.Button>
      {isOpen && (
        <MemberOptions
          isOpen={isOpen}
          projectId={projectId}
          placement={placement}
          referenceElement={referenceElement}
        />
      )}
    </Combobox>
  );
});
