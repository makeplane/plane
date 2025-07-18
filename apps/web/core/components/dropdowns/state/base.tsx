"use client";

import { ReactNode, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { ChevronDown, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IState } from "@plane/types";
import { ComboDropDown, Spinner, StateGroupIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { DropdownButton } from "@/components/dropdowns/buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "@/components/dropdowns/constants";
import { TDropdownProps } from "@/components/dropdowns/types";
// hooks
import { useDropdown } from "@/hooks/use-dropdown";
// plane web imports
import { StateOption } from "@/plane-web/components/workflow";

export type TWorkItemStateDropdownBaseProps = TDropdownProps & {
  alwaysAllowStateChange?: boolean;
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  filterAvailableStateIds?: boolean;
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  iconSize?: string;
  isForWorkItemCreation?: boolean;
  isInitializing?: boolean;
  onChange: (val: string) => void;
  onClose?: () => void;
  onDropdownOpen?: () => void;
  projectId: string | undefined;
  renderByDefault?: boolean;
  showDefaultState?: boolean;
  stateIds: string[];
  value: string | undefined | null;
};

export const WorkItemStateDropdownBase: React.FC<TWorkItemStateDropdownBaseProps> = observer((props) => {
  const {
    button,
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    getStateById,
    hideIcon = false,
    iconSize = "size-4",
    isInitializing = false,
    onChange,
    onClose,
    onDropdownOpen,
    placement,
    renderByDefault = true,
    showDefaultState = true,
    showTooltip = false,
    stateIds,
    tabIndex,
    value,
  } = props;
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // states
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const statesList = stateIds.map((stateId) => getStateById(stateId)).filter((state) => !!state);
  const defaultState = statesList?.find((state) => state?.default);
  const stateValue = !!value ? value : showDefaultState ? defaultState?.id : undefined;
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
  // dropdown init
  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef,
    inputRef,
    isOpen,
    onClose,
    onOpen: onDropdownOpen,
    query,
    setIsOpen,
    setQuery,
  });

  // derived values
  const options = statesList?.map((state) => ({
    value: state?.id,
    query: `${state?.name}`,
    content: (
      <div className="flex items-center gap-2">
        <StateGroupIcon
          stateGroup={state?.group ?? "backlog"}
          color={state?.color}
          className={cn("flex-shrink-0", iconSize)}
          percentage={state?.order}
        />
        <span className="flex-grow truncate text-left">{state?.name}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const selectedState = stateValue ? getStateById(stateValue) : undefined;

  const dropdownOnChange = (val: string) => {
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
          tabIndex={tabIndex}
        >
          {button}
        </button>
      ) : (
        <button
          tabIndex={tabIndex}
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
            tooltipHeading={t("state")}
            tooltipContent={selectedState?.name ?? t("state")}
            showTooltip={showTooltip}
            variant={buttonVariant}
            renderToolTipByDefault={renderByDefault}
          >
            {isInitializing ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <>
                {!hideIcon && (
                  <StateGroupIcon
                    stateGroup={selectedState?.group ?? "backlog"}
                    color={selectedState?.color ?? "rgba(var(--color-text-300))"}
                    className={cn("flex-shrink-0", iconSize)}
                    percentage={selectedState?.order}
                  />
                )}
                {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
                  <span className="flex-grow truncate text-left">{selectedState?.name ?? t("state")}</span>
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
      className={cn("h-full", className)}
      value={stateValue}
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
                placeholder={t("common.search.label")}
                displayValue={(assigned: any) => assigned?.name}
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
              {filteredOptions ? (
                filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <StateOption
                      {...props}
                      key={option.value}
                      option={option}
                      selectedValue={value}
                      className="flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5"
                    />
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
