import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { ChevronDown, X } from "lucide-react";
// hooks
import { useModule } from "hooks/store";
import { useDropdownKeyDown } from "hooks/use-dropdown-key-down";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { DropdownButton } from "../buttons";
// icons
import { DiceIcon, Tooltip } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TDropdownProps } from "../types";
// constants
import { BUTTON_VARIANTS_WITHOUT_TEXT } from "../constants";
import { ModuleOptions } from "./module-options";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  projectId: string;
  showCount?: boolean;
  onClose?: () => void;
} & (
    | {
        multiple: false;
        onChange: (val: string | null) => void;
        value: string | null;
      }
    | {
        multiple: true;
        onChange: (val: string[]) => void;
        value: string[];
      }
  );

type ButtonContentProps = {
  disabled: boolean;
  dropdownArrow: boolean;
  dropdownArrowClassName: string;
  hideIcon: boolean;
  hideText: boolean;
  onChange: (moduleIds: string[]) => void;
  placeholder: string;
  showCount: boolean;
  value: string | string[] | null;
};

const ButtonContent: React.FC<ButtonContentProps> = (props) => {
  const {
    disabled,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon,
    hideText,
    onChange,
    placeholder,
    showCount,
    value,
  } = props;
  // store hooks
  const { getModuleById } = useModule();

  if (Array.isArray(value))
    return (
      <>
        {showCount ? (
          <div className="relative flex items-center gap-1">
            {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
            <div className="flex-grow truncate max-w-40">
              {value.length > 0
                ? value.length === 1
                  ? `${getModuleById(value[0])?.name || "module"}`
                  : `${value.length} Module${value.length === 1 ? "" : "s"}`
                : placeholder}
            </div>
          </div>
        ) : value.length > 0 ? (
          <div className="flex items-center gap-2 py-0.5 max-w-full flex-grow truncate flex-wrap">
            {value.map((moduleId) => {
              const moduleDetails = getModuleById(moduleId);
              return (
                <div
                  key={moduleId}
                  className="flex items-center gap-1 max-w-full bg-custom-background-80 text-custom-text-200 rounded px-1.5 py-1"
                >
                  {!hideIcon && <DiceIcon className="h-2.5 w-2.5 flex-shrink-0" />}
                  {!hideText && (
                    <Tooltip tooltipHeading="Title" tooltipContent={moduleDetails?.name}>
                      <span className="text-xs font-medium flex-grow truncate max-w-40">{moduleDetails?.name}</span>
                    </Tooltip>
                  )}
                  {!disabled && (
                    <Tooltip tooltipContent="Remove">
                      <button
                        type="button"
                        className="flex-shrink-0"
                        onClick={() => {
                          const newModuleIds = value.filter((m) => m !== moduleId);
                          onChange(newModuleIds);
                        }}
                      >
                        <X className="h-2.5 w-2.5 text-custom-text-300 hover:text-red-500" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
            <span className="flex-grow truncate text-left">{placeholder}</span>
          </>
        )}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </>
    );
  else
    return (
      <>
        {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
        {!hideText && <span className="flex-grow truncate text-left">{value ?? placeholder}</span>}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </>
    );
};

export const ModuleDropdown: React.FC<Props> = observer((props) => {
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
    placeholder = "Module",
    placement,
    projectId,
    showCount = false,
    showTooltip = false,
    tabIndex,
    value,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  const { getModuleNameById } = useModule();

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    onClose && onClose();
  };

  const toggleDropdown = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
    if (isOpen) onClose && onClose();
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

  const comboboxProps: any = {
    value,
    onChange: dropdownOnChange,
    disabled,
  };
  if (multiple) comboboxProps.multiple = true;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      onKeyDown={handleKeyDown}
      {...comboboxProps}
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
              tooltipHeading="Module"
              tooltipContent={
                Array.isArray(value)
                  ? `${value
                      .map((moduleId) => getModuleNameById(moduleId))
                      .toString()
                      .replaceAll(",", ", ")}`
                  : ""
              }
              showTooltip={showTooltip}
              variant={buttonVariant}
            >
              <ButtonContent
                disabled={disabled}
                dropdownArrow={dropdownArrow}
                dropdownArrowClassName={dropdownArrowClassName}
                hideIcon={hideIcon}
                hideText={BUTTON_VARIANTS_WITHOUT_TEXT.includes(buttonVariant)}
                placeholder={placeholder}
                showCount={showCount}
                value={value}
                // @ts-ignore
                onChange={onChange}
              />
            </DropdownButton>
          </button>
        )}
      </Combobox.Button>
      {isOpen && (
        <ModuleOptions
          isOpen={isOpen}
          projectId={projectId}
          placement={placement}
          referenceElement={referenceElement}
          multiple={multiple}
        />
      )}
    </Combobox>
  );
});
