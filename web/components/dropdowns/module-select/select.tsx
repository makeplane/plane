import { FC, useEffect, useRef, useState, Fragment } from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Check, Search } from "lucide-react";
import { twMerge } from "tailwind-merge";
// hooks
import { useModule } from "hooks/store";
import { useDropdownKeyDown } from "hooks/use-dropdown-key-down";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { ModuleSelectButton } from "./";
// types
import { TModuleSelectDropdown, TModuleSelectDropdownOption } from "./types";
import { DiceIcon } from "@plane/ui";

export const ModuleSelectDropdown: FC<TModuleSelectDropdown> = observer((props) => {
  // props
  const {
    workspaceSlug,
    projectId,
    value = undefined,
    onChange,
    placeholder = "Module",
    multiple = false,
    disabled = false,
    className = "",
    buttonContainerClassName = "",
    buttonClassName = "",
    buttonVariant = "transparent-with-text",
    hideIcon = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    showTooltip = false,
    showCount = false,
    placement,
    tabIndex,
    button,
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
  const { getProjectModuleIds, fetchModules, getModuleById } = useModule();

  const moduleIds = getProjectModuleIds(projectId);

  const options: TModuleSelectDropdownOption[] | undefined = moduleIds?.map((moduleId) => {
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
  !multiple &&
    options?.unshift({
      value: undefined,
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

  const openDropdown = () => {
    if (isOpen) closeDropdown();
    else {
      setIsOpen(true);
      if (referenceElement) referenceElement.focus();
    }
  };
  const closeDropdown = () => setIsOpen(false);
  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  const comboboxProps: any = {};
  if (multiple) comboboxProps.multiple = true;

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={twMerge("h-full", className)}
      value={value}
      onChange={onChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      {...comboboxProps}
    >
      <Combobox.Button as={Fragment}>
        {button ? (
          <button
            ref={setReferenceElement}
            type="button"
            className={twMerge(
              "block h-full max-w-full outline-none",
              disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer",
              buttonContainerClassName
            )}
            onClick={openDropdown}
          >
            {button}
          </button>
        ) : (
          <button
            ref={setReferenceElement}
            type="button"
            className={twMerge(
              "block h-full max-w-full outline-none ",
              disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer",
              buttonContainerClassName
            )}
            onClick={openDropdown}
          >
            <ModuleSelectButton
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              buttonClassName={buttonClassName}
              buttonVariant={buttonVariant}
              hideIcon={hideIcon}
              hideText={["border-without-text", "background-without-text", "transparent-without-text"].includes(
                buttonVariant
              )}
              dropdownArrow={dropdownArrow}
              dropdownArrowClassName={dropdownArrowClassName}
              showTooltip={showTooltip}
              showCount={showCount}
            />
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
                displayValue={(moduleIds: any) => {
                  const displayValueOptions: TModuleSelectDropdownOption[] | undefined = options?.filter((_module) =>
                    moduleIds.includes(_module.value)
                  );
                  return displayValueOptions?.map((_option) => _option.query).join(", ") || "Select Module";
                }}
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
                        `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${
                          active ? "bg-custom-background-80" : ""
                        } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                      }
                      onClick={() => !multiple && closeDropdown()}
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
