import React, { useEffect, useRef, useState } from "react";
import type { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Component, Loader } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { getRandomLabelColor } from "@plane/constants";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { CheckIcon, SearchIcon, LabelPropertyIcon } from "@plane/propel/icons";
import type { IIssueLabel } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { IssueLabelsList } from "@/components/ui/labels-list";
// hooks
import { useDropdownKeyDown } from "@/hooks/use-dropdown-key-down";
import { usePlatformOS } from "@/hooks/use-platform-os";

export type TWorkItemLabelSelectBaseProps = {
  buttonClassName?: string;
  buttonContainerClassName?: string;
  createLabelEnabled?: boolean;
  disabled?: boolean;
  getLabelById: (labelId: string) => IIssueLabel | null;
  label?: React.ReactNode;
  labelIds: string[];
  onChange: (value: string[]) => void;
  onDropdownOpen?: () => void;
  placement?: Placement;
  createLabel?: (data: Partial<IIssueLabel>) => Promise<IIssueLabel>;
  tabIndex?: number;
  value: string[];
};

export const WorkItemLabelSelectBase = observer(function WorkItemLabelSelectBase(props: TWorkItemLabelSelectBaseProps) {
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
    createLabel,
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
  const [submitting, setSubmitting] = useState<boolean>(false);
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

  const searchInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const q = query.trim();
    if (q !== "" && e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setQuery("");
      return;
    }
    if (
      q !== "" &&
      e.key === "Enter" &&
      !e.nativeEvent.isComposing &&
      createLabelEnabled &&
      filteredOptions.length === 0 &&
      !submitting
    ) {
      e.preventDefault();
      await handleAddLabel(q);
    }
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

  const handleAddLabel = async (labelName: string) => {
    if (!createLabel || submitting) return;
    const name = labelName.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      const existing = labelsList.find((l) => l.name.toLowerCase() === name.toLowerCase());
      const idToAdd = existing ? existing.id : (await createLabel({ name, color: getRandomLabelColor() })).id;
      onChange(Array.from(new Set([...value, idToAdd])));
      setQuery("");
    } catch (e) {
      console.error("Failed to create label", e);
    } finally {
      setSubmitting(false);
    }
  };

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
        className={cn("h-full flex cursor-pointer items-center gap-2 text-11", buttonContainerClassName)}
        onClick={handleOnClick}
      >
        {label ? (
          label
        ) : value && value.length > 0 ? (
          <span className={cn("flex items-center justify-center gap-2 text-11 h-full", buttonClassName)}>
            <IssueLabelsList
              labels={value.map((v) => labelsList?.find((l) => l.id === v)) ?? []}
              length={3}
              showLength
            />
          </span>
        ) : (
          <div
            className={cn(
              "h-full flex items-center justify-center gap-1 rounded-sm border-[0.5px] border-strong px-2 py-1 text-11 hover:bg-layer-1",
              buttonClassName
            )}
          >
            <LabelPropertyIcon className="h-3 w-3 flex-shrink-0" />
            <span>{t("labels")}</span>
          </div>
        )}
      </button>

      {isDropdownOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
              <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
              <Combobox.Input
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("search")}
                displayValue={(assigned: any) => assigned?.name}
                onKeyDown={searchInputKeyDown}
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
                                active ? "bg-layer-1" : ""
                              } group flex w-full cursor-pointer select-none items-center gap-2 truncate rounded-sm px-1 py-1.5 text-secondary`
                            }
                            value={label.id}
                          >
                            {({ selected }) => (
                              <div className="flex w-full justify-between gap-2 rounded-sm">
                                <div className="flex items-center justify-start gap-2 truncate">
                                  <span
                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: label.color,
                                    }}
                                  />
                                  <span className="truncate">{label.name}</span>
                                </div>
                                <div className="flex shrink-0 items-center justify-center rounded-sm p-1">
                                  <CheckIcon className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`} />
                                </div>
                              </div>
                            )}
                          </Combobox.Option>
                        );
                    } else
                      return (
                        <div key={label.id} className="border-y border-subtle">
                          <div className="flex select-none items-center gap-2 truncate p-2 text-primary">
                            <Component className="h-3 w-3" /> {label.name}
                          </div>
                          <div>
                            {children.map((child) => (
                              <Combobox.Option
                                key={child.id}
                                className={({ active }) =>
                                  `${
                                    active ? "bg-layer-1" : ""
                                  } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded-sm px-1 py-1.5 text-secondary`
                                }
                                value={child.id}
                              >
                                {({ selected }) => (
                                  <div className="flex w-full justify-between gap-2 rounded-sm">
                                    <div className="flex items-center justify-start gap-2">
                                      <span
                                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                        style={{
                                          backgroundColor: child?.color,
                                        }}
                                      />
                                      <span>{child.name}</span>
                                    </div>
                                    <div className="flex items-center justify-center rounded-sm p-1">
                                      <CheckIcon className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`} />
                                    </div>
                                  </div>
                                )}
                              </Combobox.Option>
                            ))}
                          </div>
                        </div>
                      );
                  })
                ) : submitting ? (
                  <Loader className="animate-spin h-3.5 w-3.5" />
                ) : createLabelEnabled ? (
                  <p
                    onClick={() => {
                      if (!query.length) return;
                      handleAddLabel(query);
                    }}
                    className={`text-left text-secondary ${query.length ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {/* TODO: translate here */}
                    {query.length ? (
                      <>
                        + Add <span className="text-primary">&quot;{query}&quot;</span> to labels
                      </>
                    ) : (
                      t("label.create.type")
                    )}
                  </p>
                ) : (
                  <p className="text-placeholder italic py-1 px-1.5">{t("no_matching_results")}</p>
                )
              ) : (
                <p className="text-placeholder italic py-1 px-1.5">{t("loading")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
});
