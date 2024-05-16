import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { ChevronDown, X } from "lucide-react";
import { Combobox } from "@headlessui/react";
// ui
import { DiceIcon, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useModule } from "@/hooks/store";
import { useDropdown } from "@/hooks/use-dropdown";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { DropdownButton } from "../buttons";
import { BUTTON_VARIANTS_WITHOUT_TEXT } from "../constants";
// types
import { TDropdownProps } from "../types";
// constants
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
  placeholder?: string;
  showCount: boolean;
  showTooltip?: boolean;
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
    showTooltip = false,
    value,
  } = props;
  // store hooks
  const { getModuleById } = useModule();
  const { isMobile } = usePlatformOS();

  if (Array.isArray(value))
    return (
      <>
        {showCount ? (
          <div className="relative flex items-center max-w-full gap-1">
            {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
            {(value.length > 0 || !!placeholder) && (
              <div className="max-w-40 flex-grow truncate">
                {value.length > 0
                  ? value.length === 1
                    ? `${getModuleById(value[0])?.name || "module"}`
                    : `${value.length} Module${value.length === 1 ? "" : "s"}`
                  : placeholder}
              </div>
            )}
          </div>
        ) : value.length > 0 ? (
          <div className="flex max-w-full flex-grow flex-wrap items-center gap-2 truncate py-0.5">
            {value.map((moduleId) => {
              const moduleDetails = getModuleById(moduleId);
              return (
                <div
                  key={moduleId}
                  className="flex max-w-full items-center gap-1 rounded bg-custom-background-80 px-1.5 py-1 text-custom-text-200"
                >
                  {!hideIcon && <DiceIcon className="h-2.5 w-2.5 flex-shrink-0" />}
                  {!hideText && (
                    <Tooltip
                      tooltipHeading="Title"
                      tooltipContent={moduleDetails?.name}
                      disabled={!showTooltip}
                      isMobile={isMobile}
                    >
                      <span className="max-w-40 flex-grow truncate text-xs font-medium">{moduleDetails?.name}</span>
                    </Tooltip>
                  )}
                  {!disabled && (
                    <Tooltip tooltipContent="Remove" disabled={!showTooltip} isMobile={isMobile}>
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
    placeholder = "",
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

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    setIsOpen,
  });

  const dropdownOnChange = (val: string & string[]) => {
    onChange(val);
    if (!multiple) handleClose();
  };

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
                showTooltip={showTooltip}
                value={value}
                onChange={onChange as any}
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
