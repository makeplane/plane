import React, { useEffect, useRef, useState } from "react";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Check, Component, Plus, Search, Tag } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// plane imports
import { IIssueLabel } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { IssueLabelsList } from "@/components/ui";
// hooks
import { useDropdownKeyDown } from "@/hooks/use-dropdown-key-down";
import { usePlatformOS } from "@/hooks/use-platform-os";

export type TWorkItemLabelSelectBaseProps = {
  buttonClassName?: string;
  buttonContainerClassName?: string;
  createLabelEnabled?: boolean;
  disabled?: boolean;
  getLabelById: (labelId: string) => IIssueLabel | null;
  label?: JSX.Element;
  labelIds: string[];
  onChange: (value: string[]) => void;
  onDropdownOpen?: () => void;
  placement?: Placement;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tabIndex?: number;
  value: string[];
};

export const WorkItemLabelSelectBase: React.FC<TWorkItemLabelSelectBaseProps> = observer((props) => {
  const {
    buttonClassName,
    buttonContainerClassName,
    createLabelEnabled = false,
    disabled = false,
    getLabelById,
    label,
    labelIds,
    onChange,
    onDropdownOpen,
    placement,
    setIsOpen,
    tabIndex,
    value,
  } = props;
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // states
  const [query, setQuery] = useState("");
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { isMobile } = usePlatformOS();
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });
  // derived values
  const labelsList = labelIds.map((labelId) => getLabelById(labelId)).filter((label) => !!label);
  const filteredOptions =
    query === "" ? labelsList : labelsList?.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()));

  const onOpen = () => {
    if (referenceElement) referenceElement.focus();
    onDropdownOpen?.();
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
      <button
        type="button"
        ref={setReferenceElement}
        className={cn(
          "h-full flex cursor-pointer items-center gap-2 text-xs text-custom-text-200",
          buttonContainerClassName
        )}
        onClick={handleOnClick}
      >
        {label ? (
          label
        ) : value && value.length > 0 ? (
          <span className={cn("flex items-center justify-center gap-2 text-xs h-full", buttonClassName)}>
            <IssueLabelsList
              labels={value.map((v) => labelsList?.find((l) => l.id === v)) ?? []}
              length={3}
              showLength
            />
          </span>
        ) : (
          <div
            className={cn(
              "h-full flex items-center justify-center gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1 text-xs hover:bg-custom-background-80",
              buttonClassName
            )}
          >
            <Tag className="h-3 w-3 flex-shrink-0" />
            <span>{t("labels")}</span>
          </div>
        )}
      </button>

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
                placeholder={t("search")}
                displayValue={(assigned: any) => assigned?.name}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {labelsList && filteredOptions ? (
                filteredOptions.length > 0 ? (
                  filteredOptions.map((label) => {
                    const children = labelsList?.filter((l) => l.parent === label.id);

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
                  <p className="text-custom-text-400 italic py-1 px-1.5">{t("no_matching_results")}</p>
                )
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">{t("loading")}</p>
              )}
              {createLabelEnabled && (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full select-none rounded px-1 py-2 hover:bg-custom-background-80"
                  onClick={() => setIsOpen(true)}
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  <span className="whitespace-nowrap">{t("create_new_label")}</span>
                </button>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
});
