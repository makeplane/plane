import { Fragment, ReactNode, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { ChevronDown } from "lucide-react";
import { Combobox } from "@headlessui/react";
// hooks
import { ContrastIcon } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
import { useCycle } from "@/hooks/store";
import { useDropdownKeyDown } from "@/hooks/use-dropdown-key-down";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// components
import { DropdownButton } from "../buttons";
// icons
// helpers
// types
import { BUTTON_VARIANTS_WITH_TEXT } from "../constants";
import { TDropdownProps } from "../types";
// constants
import { CycleOptions } from "./cycle-options";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onChange: (val: string | null) => void;
  onClose?: () => void;
  projectId: string;
  value: string | null;
};

export const CycleDropdown: React.FC<Props> = observer((props) => {
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
    onChange,
    onClose,
    placeholder = "",
    placement,
    projectId,
    showTooltip = false,
    tabIndex,
    value,
  } = props;
  // states

  const [isOpen, setIsOpen] = useState(false);
  const { getCycleNameById } = useCycle();
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  const selectedName = value ? getCycleNameById(value) : null;

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    onClose && onClose();
  };

  const toggleDropdown = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
    if (isOpen) onClose && onClose();
  };

  const dropdownOnChange = (val: string | null) => {
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

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
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
            className={cn(
              "clickable block h-full w-full outline-none hover:bg-custom-background-80",
              buttonContainerClassName
            )}
            onClick={handleOnClick}
          >
            {button}
          </button>
        ) : (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn(
              "clickable block h-full max-w-full outline-none hover:bg-custom-background-80",
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
              tooltipHeading="Cycle"
              tooltipContent={selectedName ?? placeholder}
              showTooltip={showTooltip}
              variant={buttonVariant}
            >
              {!hideIcon && <ContrastIcon className="h-3 w-3 flex-shrink-0" />}
              {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (!!selectedName || !!placeholder) && (
                <span className="flex-grow truncate max-w-40">{selectedName ?? placeholder}</span>
              )}
              {dropdownArrow && (
                <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
              )}
            </DropdownButton>
          </button>
        )}
      </Combobox.Button>
      {isOpen && (
        <CycleOptions isOpen={isOpen} projectId={projectId} placement={placement} referenceElement={referenceElement} />
      )}
    </Combobox>
  );
});
