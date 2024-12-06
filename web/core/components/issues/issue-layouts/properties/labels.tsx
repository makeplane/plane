"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Search, Tags } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// types
import { IIssueLabel } from "@plane/types";
// ui
import { ComboDropDown, Tooltip } from "@plane/ui";
// hooks
import { useLabel } from "@/hooks/store";
import { useDropdownKeyDown } from "@/hooks/use-dropdown-key-down";
import { usePlatformOS } from "@/hooks/use-platform-os";

export interface IIssuePropertyLabels {
  projectId: string | null;
  value: string[];
  defaultOptions?: any;
  onChange: (data: string[]) => void;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  placement?: Placement;
  maxRender?: number;
  noLabelBorder?: boolean;
  placeholderText?: string;
  onClose?: () => void;
  renderByDefault?: boolean;
  fullWidth?: boolean;
}

export const IssuePropertyLabels: React.FC<IIssuePropertyLabels> = observer((props) => {
  const {
    projectId,
    value,
    defaultOptions = [],
    onChange,
    onClose,
    disabled,
    hideDropdownArrow = false,
    className,
    buttonClassName = "",
    optionsClassName = "",
    placement,
    maxRender = 2,
    noLabelBorder = false,
    placeholderText,
    renderByDefault = true,
    fullWidth = false,
  } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // store hooks
  const { fetchProjectLabels, getProjectLabels } = useLabel();
  const { isMobile } = usePlatformOS();
  const storeLabels = getProjectLabels(projectId);

  const onOpen = () => {
    if (!storeLabels && workspaceSlug && projectId)
      fetchProjectLabels(workspaceSlug, projectId).then(() => setIsLoading(false));
  };

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    setQuery("");
    onClose && onClose();
  };

  const toggleDropdown = () => {
    if (!isOpen) onOpen();
    setIsOpen((prevIsOpen) => !prevIsOpen);
    if (isOpen) onClose && onClose();
  };

  const handleKeyDown = useDropdownKeyDown(toggleDropdown, handleClose);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleDropdown();
  };

  useOutsideClickDetector(dropdownRef, handleClose);

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }
  };

  useEffect(() => {
    if (isOpen && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [isOpen, isMobile]);

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

  if (!value) return null;

  let projectLabels: IIssueLabel[] = defaultOptions;
  if (storeLabels && storeLabels.length > 0) projectLabels = storeLabels;

  const options = projectLabels.map((label) => ({
    value: label?.id,
    query: label?.name,
    content: (
      <div className="flex items-center justify-start gap-2 overflow-hidden">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label?.color,
          }}
        />
        <div className="line-clamp-1 inline-block truncate">{label?.name}</div>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const label = (
    <div className="flex h-full w-full flex-wrap items-center gap-2 overflow-hidden">
      {value.length > 0 ? (
        value.length <= maxRender ? (
          <>
            {projectLabels
              ?.filter((l) => value.includes(l?.id))
              .map((label) => (
                <Tooltip
                  key={label.id}
                  position="top"
                  tooltipHeading="Labels"
                  tooltipContent={label?.name ?? ""}
                  isMobile={isMobile}
                  renderByDefault={renderByDefault}
                >
                  <div
                    key={label?.id}
                    className={`flex overflow-hidden hover:bg-custom-background-80 ${
                      !disabled && "cursor-pointer"
                    } h-full ${fullWidth && "w-full"} max-w-full flex-shrink-0 items-center rounded px-2.5 text-xs ${noLabelBorder ? "rounded-none" : "border-[0.5px] border-custom-border-300"}`}
                  >
                    <div className="flex max-w-full items-center gap-1.5 overflow-hidden text-custom-text-200">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: label?.color ?? "#000000",
                        }}
                      />
                      <div className="line-clamp-1 inline-block w-auto max-w-[100px] truncate">{label?.name}</div>
                    </div>
                  </div>
                </Tooltip>
              ))}
          </>
        ) : (
          <div
            className={`flex h-full ${fullWidth && "w-full"} flex-shrink-0 items-center rounded px-2.5 text-xs ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            } ${noLabelBorder ? "rounded-none" : "border-[0.5px] border-custom-border-300"}`}
          >
            <Tooltip
              isMobile={isMobile}
              position="top"
              tooltipHeading="Labels"
              tooltipContent={projectLabels
                ?.filter((l) => value.includes(l?.id))
                .map((l) => l?.name)
                .join(", ")}
              renderByDefault={false}
            >
              <div className="flex h-full items-center gap-1.5 text-custom-text-200">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-custom-primary" />
                {`${value.length} Labels`}
              </div>
            </Tooltip>
          </div>
        )
      ) : (
        <Tooltip
          position="top"
          tooltipHeading="Labels"
          tooltipContent="None"
          isMobile={isMobile}
          renderByDefault={false}
        >
          <div
            className={`flex h-full ${fullWidth && "w-full"} items-center justify-center gap-2 rounded px-2.5 py-1 text-xs hover:bg-custom-background-80 ${
              noLabelBorder ? "rounded-none" : "border-[0.5px] border-custom-border-300"
            }`}
          >
            <Tags className="h-3.5 w-3.5" strokeWidth={2} />
            {placeholderText}
          </div>
        </Tooltip>
      )}
    </div>
  );

  const comboButton = (
    <button
      ref={setReferenceElement}
      type="button"
      className={`clickable flex w-full h-full items-center justify-between gap-1 text-xs ${fullWidth && "hover:bg-custom-background-80"} ${
        disabled
          ? "cursor-not-allowed text-custom-text-200"
          : value.length <= maxRender
            ? "cursor-pointer"
            : "cursor-pointer hover:bg-custom-background-80"
      }  ${buttonClassName}`}
      onClick={handleOnClick}
      disabled={disabled}
    >
      {label}
      {!hideDropdownArrow && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
    </button>
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={`w-auto max-w-full h-full flex-shrink-0 text-left ${className}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={comboButton}
      renderByDefault={renderByDefault}
      multiple
    >
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className={`z-10 my-1 w-48 h-auto whitespace-nowrap rounded border border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none ${optionsClassName}`}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
              <Search className="h-3.5 w-3.5 text-custom-text-300" />
              <Combobox.Input
                ref={inputRef}
                className="w-full bg-transparent px-2 py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name || ""}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className={`mt-2 max-h-48 space-y-1 overflow-y-scroll`}>
              {isLoading ? (
                <p className="text-center text-custom-text-200">Loading...</p>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    className={({ active, selected }) =>
                      `flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 hover:bg-custom-background-80 ${
                        active ? "bg-custom-background-80" : ""
                      } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        {option.content}
                        {selected && (
                          <div className="flex-shrink-0">
                            <Check className={`h-3.5 w-3.5`} />
                          </div>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <span className="flex items-center gap-2 p-1">
                  <p className="text-left text-custom-text-200 ">No matching results</p>
                </span>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
});
