"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
// ui
import { ComboDropDown, Spinner } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueType } from "@/hooks/store";
import { useDropdown } from "@/hooks/use-dropdown";
// components
import { DropdownButton } from "./buttons";
// constants
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";
// types
import { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onChange: (val: string | null) => void;
  onClose?: () => void;
  value: string | undefined | null;
  workspaceSlug: string | undefined;
  renderByDefault?: boolean;
};

export const IssueTypeDropdown: React.FC<Props> = observer((props) => {
  const {
    button,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    onChange,
    onClose,
    placement,
    value,
    workspaceSlug,
    tabIndex,
    renderByDefault = true,
  } = props;

  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [typeLoader, setTypeLoader] = useState(false);

  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: { padding: 12 },
      },
    ],
  });

  // store hooks
  const { t } = useTranslation();
  const { fetchWorkspaceIssueTypes, getIssueTypesForWorkspace, getIssueTypeById } = useIssueType();

  const issueTypes = getIssueTypesForWorkspace(workspaceSlug?.toString() ?? "");
  const selectedType = value ? getIssueTypeById(value) : undefined;

  const options = (issueTypes ?? []).map((type) => ({
    value: type.id,
    query: `${type?.name}`,
    content: (
      <div className="flex items-center gap-2">
        {type.logo_props && Object.keys(type.logo_props).length > 0 && (
          <div className="h-3 w-3 flex-shrink-0">
            {type.logo_props?.emoji ? (
              <span className="text-xs">{type.logo_props.emoji}</span>
            ) : (
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: type.logo_props?.color || "#000000" }}
              />
            )}
          </div>
        )}
        <span className="flex-grow truncate">{type?.name}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const onOpen = async () => {
    if (!issueTypes && workspaceSlug) {
      setTypeLoader(true);
      await fetchWorkspaceIssueTypes(workspaceSlug);
      setTypeLoader(false);
    }
  };

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    onOpen,
    query,
    setIsOpen,
    setQuery,
  });

  useEffect(() => {
    if (workspaceSlug) onOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const dropdownOnChange = (val: string | null) => {
    onChange(val);
    handleClose();
  };

  const comboButton = (
    <>
      {button ? (
        <button
          ref={setReferenceElement}
          type="button"
          className={cn("clickable block h-full w-full outline-none", buttonContainerClassName)}
          onClick={handleOnClick}
          disabled={disabled}
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
          disabled={disabled}
        >
          <DropdownButton
            className={buttonClassName}
            isActive={isOpen}
            tooltipHeading={t("issue_type")}
            tooltipContent={selectedType?.name ?? t("issue_type")}
            showTooltip={false}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {typeLoader ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <>
                {selectedType?.logo_props && Object.keys(selectedType.logo_props).length > 0 && (
                  <div className="h-3 w-3 flex-shrink-0">
                    {selectedType.logo_props?.emoji ? (
                      <span className="text-xs">{selectedType.logo_props.emoji}</span>
                    ) : (
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: selectedType.logo_props?.color || "#000000" }}
                      />
                    )}
                  </div>
                )}
                {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
                  <span className="flex-grow truncate">{selectedType?.name ?? t("issue_type")}</span>
                )}
                {dropdownArrow && (
                  <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
                )}
              </>
            )}
          </DropdownButton>
        </button>
      )}
    </>
  );

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      value={value}
      onChange={dropdownOnChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      button={comboButton}
      renderByDefault={renderByDefault}
    >
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
                as="input"
                ref={inputRef}
                className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                displayValue={(assigned: any) => assigned?.name}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {filteredOptions ? (
                filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <Combobox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active, selected }) =>
                        `flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 ${
                          active ? "bg-custom-background-80" : ""
                        } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
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
                  <p className="px-1.5 py-1 italic text-custom-text-400">{t("no_matching_results")}</p>
                )
              ) : (
                <p className="px-1.5 py-1 italic text-custom-text-400">{t("loading")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
});

IssueTypeDropdown.displayName = "IssueTypeDropdown";
