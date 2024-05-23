import { Fragment, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { ChevronDown } from "lucide-react";
// headless ui
import { Combobox } from "@headlessui/react";
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
    tooltipContent,
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
              tooltipContent={tooltipContent ?? `${value?.length ?? 0} assignee${value?.length !== 1 ? "s" : ""}`}
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
