import React, { Fragment, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Check, Component, Plus, Search, Tag } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane helpers
import { useOutsideClickDetector } from "@plane/helpers";
// components
import { IssueLabelsList } from "@/components/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useLabel } from "@/hooks/store";
import { useDropdownKeyDown } from "@/hooks/use-dropdown-key-down";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string[];
  onChange: (value: string[]) => void;
  projectId: string | undefined;
  label?: JSX.Element;
  disabled?: boolean;
  tabIndex?: number;
  createLabelEnabled?: boolean;
  buttonClassName?: string;
};

export const IssueLabelSelect: React.FC<Props> = observer((props) => {
  const {
    setIsOpen,
    value,
    onChange,
    projectId,
    label,
    disabled = false,
    tabIndex,
    createLabelEnabled = false,
    buttonClassName,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectLabels, fetchProjectLabels } = useLabel();
  const { isMobile } = usePlatformOS();
  // states
  const [query, setQuery] = useState("");
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  const projectLabels = getProjectLabels(projectId);

  // derived values
  const filteredOptions =
    query === "" ? projectLabels : projectLabels?.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()));

  const onOpen = () => {
    if (!projectLabels && workspaceSlug && projectId) fetchProjectLabels(workspaceSlug.toString(), projectId);
    if (referenceElement) referenceElement.focus();
  };

  const handleClose = () => {
    if (isDropdownOpen) setIsDropdownOpen(false);
    if (referenceElement) referenceElement.blur();
    setQuery("");
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen) onOpen();
    setIsDropdownOpen((prevIsOpen) => !prevIsOpen);
  };

  const dropdownOnChange = (val: string[]) => {
    onChange(val);
  };

  const handleKeyDown = useDropdownKeyDown(toggleDropdown, handleClose);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleDropdown();
  };

  useOutsideClickDetector(dropdownRef, handleClose);

  useEffect(() => {
    if (isDropdownOpen && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [isDropdownOpen, isMobile]);

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      value={value}
      onChange={dropdownOnChange}
      className="relative flex-shrink-0 h-full"
      multiple
      disabled={disabled}
      onKeyDown={handleKeyDown}
    >
      <Combobox.Button as={Fragment}>
        <button
          type="button"
          ref={setReferenceElement}
          className={cn("h-full flex cursor-pointer items-center gap-2 text-xs text-custom-text-200", buttonClassName)}
          onClick={handleOnClick}
        >
          {label ? (
            label
          ) : value && value.length > 0 ? (
            <span className="flex items-center justify-center gap-2 text-xs h-full">
              <IssueLabelsList
                labels={value.map((v) => projectLabels?.find((l) => l.id === v)) ?? []}
                length={3}
                showLength
              />
            </span>
          ) : (
            <div className="h-full flex items-center justify-center gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1 text-xs hover:bg-custom-background-80">
              <Tag className="h-3 w-3 flex-shrink-0" />
              <span>Labels</span>
            </div>
          )}
        </button>
      </Combobox.Button>

      {isDropdownOpen && (
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
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {projectLabels && filteredOptions ? (
                filteredOptions.length > 0 ? (
                  filteredOptions.map((label) => {
                    const children = projectLabels?.filter((l) => l.parent === label.id);

                    if (children.length === 0) {
                      if (!label.parent)
                        return (
                          <Combobox.Option
                            key={label.id}
                            className={({ active }) =>
                              `${
                                active ? "bg-custom-background-80" : ""
                              } group flex w-full cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-custom-text-200`
                            }
                            value={label.id}
                          >
                            {({ selected }) => (
                              <div className="flex w-full justify-between gap-2 rounded">
                                <div className="flex items-center justify-start gap-2 truncate">
                                  <span
                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: label.color,
                                    }}
                                  />
                                  <span className="truncate">{label.name}</span>
                                </div>
                                <div className="flex shrink-0 items-center justify-center rounded p-1">
                                  <Check className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`} />
                                </div>
                              </div>
                            )}
                          </Combobox.Option>
                        );
                    } else
                      return (
                        <div key={label.id} className="border-y border-custom-border-200">
                          <div className="flex select-none items-center gap-2 truncate p-2 text-custom-text-100">
                            <Component className="h-3 w-3" /> {label.name}
                          </div>
                          <div>
                            {children.map((child) => (
                              <Combobox.Option
                                key={child.id}
                                className={({ active }) =>
                                  `${
                                    active ? "bg-custom-background-80" : ""
                                  } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-custom-text-200`
                                }
                                value={child.id}
                              >
                                {({ selected }) => (
                                  <div className="flex w-full justify-between gap-2 rounded">
                                    <div className="flex items-center justify-start gap-2">
                                      <span
                                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                        style={{
                                          backgroundColor: child?.color,
                                        }}
                                      />
                                      <span>{child.name}</span>
                                    </div>
                                    <div className="flex items-center justify-center rounded p-1">
                                      <Check className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`} />
                                    </div>
                                  </div>
                                )}
                              </Combobox.Option>
                            ))}
                          </div>
                        </div>
                      );
                  })
                ) : (
                  <p className="text-custom-text-400 italic py-1 px-1.5">No matching results</p>
                )
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">Loading...</p>
              )}
              {createLabelEnabled && (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full select-none rounded px-1 py-2 hover:bg-custom-background-80"
                  onClick={() => setIsOpen(true)}
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  <span className="whitespace-nowrap">Create new label</span>
                </button>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
});
