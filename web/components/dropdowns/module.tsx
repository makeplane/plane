import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Search, X } from "lucide-react";
// hooks
import { useApplication, useModule } from "hooks/store";
import { useDropdownKeyDown } from "hooks/use-dropdown-key-down";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { DropdownButton } from "./buttons";
// icons
import { DiceIcon, Tooltip } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TDropdownProps } from "./types";
// constants
import { BUTTON_VARIANTS_WITHOUT_TEXT } from "./constants";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  projectId: string;
  showCount?: boolean;
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

type DropdownOptions =
  | {
      value: string | null;
      query: string;
      content: JSX.Element;
    }[]
  | undefined;

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
          <>
            {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
            <span className="flex-grow truncate text-left">
              {value.length > 0 ? `${value.length} Module${value.length === 1 ? "" : "s"}` : placeholder}
            </span>
          </>
        ) : value.length > 0 ? (
          <div className="flex items-center gap-2 py-0.5 flex-wrap">
            {value.map((moduleId) => {
              const moduleDetails = getModuleById(moduleId);
              return (
                <div
                  key={moduleId}
                  className="flex items-center gap-1 bg-custom-background-80 text-custom-text-200 rounded px-1.5 py-1"
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
    placeholder = "Module",
    placement,
    projectId,
    showCount = false,
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
  // store hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { getProjectModuleIds, fetchModules, getModuleById } = useModule();
  const moduleIds = getProjectModuleIds(projectId);

  const options: DropdownOptions = moduleIds?.map((moduleId) => {
    const moduleDetails = getModuleById(moduleId);
    return {
      value: moduleId,
      query: `${moduleDetails?.name}`,
      content: (
        <div className="flex items-center gap-2">
          <DiceIcon className="h-3 w-3 flex-shrink-0" />
          <span className="flex-grow truncate">{moduleDetails?.name}</span>
        </div>
      ),
    };
  });
  if (!multiple)
    options?.unshift({
      value: null,
      query: "No module",
      content: (
        <div className="flex items-center gap-2">
          <DiceIcon className="h-3 w-3 flex-shrink-0" />
          <span className="flex-grow truncate">No module</span>
        </div>
      ),
    });

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  // fetch modules of the project if not already present in the store
  useEffect(() => {
    if (!workspaceSlug) return;

    if (!moduleIds) fetchModules(workspaceSlug, projectId);
  }, [moduleIds, fetchModules, projectId, workspaceSlug]);

  const onOpen = () => {
    if (referenceElement) referenceElement.focus();
  };

  const handleClose = () => {
    if (isOpen) setIsOpen(false);
    if (referenceElement) referenceElement.blur();
  };

  const toggleDropdown = () => {
    if (!isOpen) onOpen();
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

  const comboboxProps: any = {
    value,
    onChange: dropdownOnChange,
    disabled,
  };
  if (multiple) comboboxProps.multiple = true;

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
            className={cn("block h-full w-full outline-none", buttonContainerClassName)}
            onClick={handleOnClick}
          >
            {button}
          </button>
        ) : (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn(
              "block h-full max-w-full outline-none",
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
                Array.isArray(value) ? `${value?.length ?? 0} module${value?.length !== 1 ? "s" : ""}` : ""
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
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
              <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
              <Combobox.Input
                className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {filteredOptions ? (
                filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <Combobox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active, selected }) =>
                        cn(
                          "w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none",
                          {
                            "bg-custom-background-80": active,
                            "text-custom-text-100": selected,
                            "text-custom-text-200": !selected,
                          }
                        )
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
                  <p className="text-custom-text-400 italic py-1 px-1.5">No matching results</p>
                )
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">Loading...</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
});
